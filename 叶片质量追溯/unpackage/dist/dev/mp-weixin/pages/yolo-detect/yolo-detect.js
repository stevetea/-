"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_storage = require("../../utils/storage.js");
const utils_config = require("../../utils/config.js");
const _sfc_main = {
  data() {
    return {
      selectedImage: "",
      selectedImagePath: "",
      detecting: false,
      detectionResult: null,
      errorMessage: "",
      modelInfo: null
    };
  },
  onLoad() {
    this.checkPermission();
    this.loadModelInfo();
  },
  methods: {
    checkPermission() {
      const userInfo = utils_storage.storage.getUserInfo();
      if (!userInfo || userInfo.role !== "ADMIN") {
        common_vendor.index.showModal({
          title: "权限不足",
          content: "此功能仅限管理员使用",
          showCancel: false,
          success: () => {
            common_vendor.index.navigateBack();
          }
        });
      }
    },
    async loadModelInfo() {
      try {
        const res = await utils_request.get("/yolo/model-info");
        if (res && res.data) {
          this.modelInfo = res.data;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/yolo-detect/yolo-detect.vue:128", "加载模型信息失败:", error);
      }
    },
    chooseImage() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          this.selectedImage = res.tempFilePaths[0];
          this.selectedImagePath = res.tempFilePaths[0];
          this.detectionResult = null;
          this.errorMessage = "";
        },
        fail: (error) => {
          common_vendor.index.__f__("error", "at pages/yolo-detect/yolo-detect.vue:144", "选择图片失败:", error);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none"
          });
        }
      });
    },
    async startDetection() {
      if (!this.selectedImagePath) {
        common_vendor.index.showToast({
          title: "请先选择图片",
          icon: "none"
        });
        return;
      }
      this.detecting = true;
      this.errorMessage = "";
      this.detectionResult = null;
      try {
        const uploadTask = common_vendor.index.uploadFile({
          url: this.getApiUrl("/yolo/detect"),
          filePath: this.selectedImagePath,
          name: "image",
          header: {
            "Authorization": `Bearer ${utils_storage.storage.getToken()}`
          },
          success: (uploadRes) => {
            try {
              const result = JSON.parse(uploadRes.data);
              if (result.code === 200) {
                this.detectionResult = result.data;
                common_vendor.index.showToast({
                  title: "检测完成",
                  icon: "success"
                });
              } else {
                this.errorMessage = result.message || "检测失败";
                common_vendor.index.showToast({
                  title: result.message || "检测失败",
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/yolo-detect/yolo-detect.vue:193", "解析检测结果失败:", error);
              this.errorMessage = "解析检测结果失败";
              common_vendor.index.showToast({
                title: "解析结果失败",
                icon: "none"
              });
            }
          },
          fail: (error) => {
            common_vendor.index.__f__("error", "at pages/yolo-detect/yolo-detect.vue:202", "上传图片失败:", error);
            this.errorMessage = "上传图片失败: " + (error.errMsg || "未知错误");
            common_vendor.index.showToast({
              title: "上传失败",
              icon: "none"
            });
          },
          complete: () => {
            this.detecting = false;
          }
        });
        uploadTask.onProgressUpdate((res) => {
          common_vendor.index.__f__("log", "at pages/yolo-detect/yolo-detect.vue:216", "上传进度:", res.progress + "%");
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/yolo-detect/yolo-detect.vue:220", "检测失败:", error);
        this.errorMessage = "检测失败: " + error.message;
        this.detecting = false;
        common_vendor.index.showToast({
          title: "检测失败",
          icon: "none"
        });
      }
    },
    getApiUrl(path) {
      return utils_config.API_BASE_URL + path;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.modelInfo
  }, $data.modelInfo ? common_vendor.e({
    b: common_vendor.t($data.modelInfo.exists ? "已加载" : "未找到"),
    c: common_vendor.n($data.modelInfo.exists ? "success" : "error"),
    d: $data.modelInfo.exists
  }, $data.modelInfo.exists ? {
    e: common_vendor.t($data.modelInfo.sizeMB)
  } : {}) : {}, {
    f: !$data.selectedImage
  }, !$data.selectedImage ? {
    g: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args))
  } : {
    h: $data.selectedImage,
    i: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args)),
    j: common_vendor.t($data.detecting ? "检测中..." : "开始检测"),
    k: common_vendor.o((...args) => $options.startDetection && $options.startDetection(...args)),
    l: $data.detecting
  }, {
    m: $data.detectionResult
  }, $data.detectionResult ? common_vendor.e({
    n: common_vendor.t($data.detectionResult.count),
    o: $data.detectionResult.resultImage
  }, $data.detectionResult.resultImage ? {
    p: $data.detectionResult.resultImage
  } : {}, {
    q: $data.detectionResult.detections && $data.detectionResult.detections.length > 0
  }, $data.detectionResult.detections && $data.detectionResult.detections.length > 0 ? {
    r: common_vendor.f($data.detectionResult.detections, (item, index, i0) => {
      return {
        a: common_vendor.t(item.class),
        b: common_vendor.t((item.confidence * 100).toFixed(1)),
        c: common_vendor.t(Math.round(item.bbox.x1)),
        d: common_vendor.t(Math.round(item.bbox.y1)),
        e: common_vendor.t(Math.round(item.bbox.x2)),
        f: common_vendor.t(Math.round(item.bbox.y2)),
        g: index
      };
    })
  } : {}) : {}, {
    s: $data.errorMessage
  }, $data.errorMessage ? {
    t: common_vendor.t($data.errorMessage)
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-8c7e7c79"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/yolo-detect/yolo-detect.js.map
