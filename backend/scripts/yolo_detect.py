#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
YOLO检测脚本
用于从Node.js调用YOLO模型进行检测
"""

import sys
import json
import base64
import os
from pathlib import Path
from ultralytics import YOLO
import cv2
import numpy as np

# 重定向stderr，避免YOLO的进度信息干扰JSON输出
class SuppressStderr:
    def __enter__(self):
        self.null_fd = os.open(os.devnull, os.O_RDWR)
        self.save_fd = os.dup(2)
        os.dup2(self.null_fd, 2)
        return self
    
    def __exit__(self, *_):
        os.dup2(self.save_fd, 2)
        os.close(self.null_fd)
        os.close(self.save_fd)

def detect_image(model_path, image_path):
    """
    使用YOLO模型检测图片
    
    Args:
        model_path: 模型文件路径
        image_path: 图片文件路径
    
    Returns:
        dict: 包含检测结果的字典
    """
    try:
        # 加载模型
        with SuppressStderr():
            model = YOLO(model_path)
            
            # 执行检测（静默模式，不输出进度信息）
            results = model.predict(
                image_path,
                conf=0.25,  # 置信度阈值
                iou=0.45,   # IoU阈值
                imgsz=640,  # 图片尺寸
                verbose=False  # 不输出详细信息
            )
        
        # 处理检测结果
        detections = []
        
        # 读取原始图片用于绘制检测框
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f'无法读取图片: {image_path}')
        
        img_height, img_width = img.shape[:2]
        
        if results and len(results) > 0:
            result = results[0]
            
            # 获取检测框信息
            if result.boxes is not None and len(result.boxes) > 0:
                boxes = result.boxes.xyxy.cpu().numpy()  # 检测框坐标
                confidences = result.boxes.conf.cpu().numpy()  # 置信度
                class_ids = result.boxes.cls.cpu().numpy().astype(int)  # 类别ID
                
                # 获取类别名称
                class_names = result.names
                
                for i in range(len(boxes)):
                    box = boxes[i]
                    confidence = float(confidences[i])
                    class_id = int(class_ids[i])
                    class_name = class_names.get(class_id, 'unknown')
                    
                    detections.append({
                        'class': class_name,
                        'confidence': round(confidence, 4),
                        'bbox': {
                            'x1': float(box[0]),
                            'y1': float(box[1]),
                            'x2': float(box[2]),
                            'y2': float(box[3])
                        }
                    })
                    
                    # 在图片上绘制检测框（蓝色，类似第二张图的样式）
                    x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
                    # 绘制蓝色边框（BGR格式）
                    cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 2)
                    
                    # 添加标签（蓝色背景，白色文字）
                    label = f'{class_name} {confidence:.2f}'
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = 0.6
                    thickness = 2
                    (label_width, label_height), baseline = cv2.getTextSize(label, font, font_scale, thickness)
                    
                    # 标签背景框（蓝色）
                    label_y = max(y1 - 10, label_height + 10)
                    cv2.rectangle(img, 
                                (x1, label_y - label_height - 5), 
                                (x1 + label_width + 5, label_y + 5), 
                                (255, 0, 0), -1)
                    
                    # 标签文字（白色）
                    cv2.putText(img, label, (x1 + 2, label_y - 2), 
                              font, font_scale, (255, 255, 255), thickness)
        
        # 无论是否有检测结果，都返回标注后的图片（base64编码）
        _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        result_image = f'data:image/jpeg;base64,{img_base64}'
        
        return {
            'detections': detections,
            'count': len(detections),
            'resultImage': result_image
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detections': [],
            'count': 0,
            'resultImage': None
        }

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(json.dumps({
            'error': '参数错误：需要模型路径和图片路径',
            'detections': [],
            'count': 0,
            'resultImage': None
        }))
        sys.exit(1)
    
    model_path = sys.argv[1]
    image_path = sys.argv[2]
    
    # 检查文件是否存在
    if not Path(model_path).exists():
        print(json.dumps({
            'error': f'模型文件不存在: {model_path}',
            'detections': [],
            'count': 0,
            'resultImage': None
        }))
        sys.exit(1)
    
    if not Path(image_path).exists():
        print(json.dumps({
            'error': f'图片文件不存在: {image_path}',
            'detections': [],
            'count': 0,
            'resultImage': None
        }))
        sys.exit(1)
    
    # 执行检测
    result = detect_image(model_path, image_path)
    
    # 输出JSON结果
    print(json.dumps(result, ensure_ascii=False))

