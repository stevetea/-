/**
 * YOLO检测路由
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'yolo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|bmp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片格式：jpeg, jpg, png, bmp, gif'));
    }
  }
});

// 模型路径（根据实际情况调整）
const MODEL_PATH = path.join(__dirname, '../../best.pt');

/**
 * 使用Python脚本执行YOLO检测
 */
async function runYOLODetection(imagePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../scripts/yolo_detect.py');
    const pythonProcess = spawn('python', [pythonScript, MODEL_PATH, imagePath], {
      stdio: ['pipe', 'pipe', 'pipe'] // 明确指定stdio
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      // YOLO的进度信息会输出到stderr，但我们已经在Python脚本中抑制了
      // 这里只收集真正的错误信息
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      // 清理stdout，只保留JSON部分（去除可能的YOLO输出）
      const jsonStart = stdout.indexOf('{');
      const jsonEnd = stdout.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        reject(new Error(`无法找到JSON结果。stdout: ${stdout.substring(0, 200)}, stderr: ${stderr.substring(0, 200)}`));
        return;
      }
      
      const jsonStr = stdout.substring(jsonStart, jsonEnd);
      
      try {
        const result = JSON.parse(jsonStr);
        resolve(result);
      } catch (error) {
        reject(new Error(`解析检测结果失败: ${error.message}。JSON字符串: ${jsonStr.substring(0, 200)}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`启动Python进程失败: ${error.message}`));
    });
  });
}

/**
 * POST /api/yolo/detect
 * 图片检测接口（仅管理员）
 */
router.post('/detect', authenticateToken, checkRole('ADMIN'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请上传图片文件'
      });
    }

    const imagePath = req.file.path;
    
    // 检查模型文件是否存在
    if (!fs.existsSync(MODEL_PATH)) {
      // 删除上传的临时文件
      fs.unlinkSync(imagePath);
      return res.status(500).json({
        code: 500,
        message: '模型文件不存在，请检查 best.pt 文件路径'
      });
    }

    // 执行检测
    console.log('开始检测图片:', imagePath);
    const detectionResult = await runYOLODetection(imagePath);
    
    const detectionResults = detectionResult.detections || [];
    const resultImagePath = detectionResult.resultImage || null;

    // 清理上传的临时文件
    try {
      fs.unlinkSync(imagePath);
    } catch (error) {
      console.error('删除临时文件失败:', error);
    }

    res.json({
      code: 200,
      message: '检测完成',
      data: {
        detections: detectionResults,
        count: detectionResults.length,
        resultImage: resultImagePath // 标注后的图片（如果有）
      }
    });

  } catch (error) {
    console.error('YOLO检测错误:', error);
    
    // 清理上传的临时文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('清理临时文件失败:', e);
      }
    }
    
    res.status(500).json({
      code: 500,
      message: '检测失败: ' + error.message
    });
  }
});

/**
 * GET /api/yolo/model-info
 * 获取模型信息（仅管理员）
 */
router.get('/model-info', authenticateToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const modelExists = fs.existsSync(MODEL_PATH);
    const modelStats = modelExists ? fs.statSync(MODEL_PATH) : null;
    
    res.json({
      code: 200,
      data: {
        modelPath: MODEL_PATH,
        exists: modelExists,
        size: modelStats ? modelStats.size : 0,
        sizeMB: modelStats ? (modelStats.size / 1024 / 1024).toFixed(2) : 0,
        loaded: true
      }
    });
  } catch (error) {
    console.error('获取模型信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型信息失败: ' + error.message
    });
  }
});

module.exports = router;

