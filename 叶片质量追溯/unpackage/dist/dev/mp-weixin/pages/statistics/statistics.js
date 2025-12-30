"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_storage = require("../../utils/storage.js");
const _sfc_main = {
  data() {
    return {
      statistics: {},
      loading: false,
      maxDailyCount: 0
    };
  },
  onLoad() {
    const userInfo = utils_storage.storage.getUserInfo();
    if (!userInfo || userInfo.role !== "ADMIN") {
      common_vendor.index.showToast({
        title: "无权限访问",
        icon: "none"
      });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 1500);
      return;
    }
    this.loadStatistics();
  },
  onPullDownRefresh() {
    this.loadStatistics();
  },
  methods: {
    async loadStatistics() {
      this.loading = true;
      try {
        const res = await utils_request.get("/statistics");
        if (res && res.data) {
          this.statistics = res.data;
          if (res.data.dailyBlade && res.data.dailyBlade.length > 0) {
            this.maxDailyCount = Math.max(...res.data.dailyBlade.map((item) => item.count));
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/statistics/statistics.vue:189", "加载统计数据失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
        common_vendor.index.stopPullDownRefresh();
      }
    },
    formatDate(dateStr) {
      if (!dateStr)
        return "";
      const date = new Date(dateStr);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${month}-${day}`;
    },
    getBarWidth(count) {
      if (!this.maxDailyCount || this.maxDailyCount === 0)
        return 0;
      return Math.min(count / this.maxDailyCount * 100, 100);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
  return common_vendor.e({
    a: common_vendor.t(((_a = $data.statistics.blade) == null ? void 0 : _a.total) || 0),
    b: common_vendor.t(((_b = $data.statistics.blade) == null ? void 0 : _b.new_count) || 0),
    c: common_vendor.t(((_c = $data.statistics.blade) == null ? void 0 : _c.in_process_count) || 0),
    d: common_vendor.t(((_d = $data.statistics.blade) == null ? void 0 : _d.blocked_count) || 0),
    e: common_vendor.t(((_e = $data.statistics.blade) == null ? void 0 : _e.ready_for_qc_count) || 0),
    f: common_vendor.t(((_f = $data.statistics.blade) == null ? void 0 : _f.completed_count) || 0),
    g: common_vendor.t(((_g = $data.statistics.blade) == null ? void 0 : _g.scrapped_count) || 0),
    h: common_vendor.t(((_h = $data.statistics.user) == null ? void 0 : _h.total) || 0),
    i: common_vendor.t(((_i = $data.statistics.user) == null ? void 0 : _i.operator_count) || 0),
    j: common_vendor.t(((_j = $data.statistics.user) == null ? void 0 : _j.qc_count) || 0),
    k: common_vendor.t(((_k = $data.statistics.user) == null ? void 0 : _k.admin_count) || 0),
    l: common_vendor.t(((_l = $data.statistics.user) == null ? void 0 : _l.active_count) || 0),
    m: common_vendor.t(((_m = $data.statistics.process) == null ? void 0 : _m.total_records) || 0),
    n: common_vendor.t(((_n = $data.statistics.process) == null ? void 0 : _n.success_count) || 0),
    o: common_vendor.t(((_o = $data.statistics.process) == null ? void 0 : _o.fail_count) || 0),
    p: ((_p = $data.statistics.process) == null ? void 0 : _p.total_records) > 0
  }, ((_q = $data.statistics.process) == null ? void 0 : _q.total_records) > 0 ? {
    q: common_vendor.t(Math.round($data.statistics.process.success_count / $data.statistics.process.total_records * 100))
  } : {}, {
    r: common_vendor.t(((_r = $data.statistics.qc) == null ? void 0 : _r.total) || 0),
    s: common_vendor.t(((_s = $data.statistics.qc) == null ? void 0 : _s.pass_count) || 0),
    t: common_vendor.t(((_t = $data.statistics.qc) == null ? void 0 : _t.fail_count) || 0),
    v: ((_u = $data.statistics.qc) == null ? void 0 : _u.total) > 0
  }, ((_v = $data.statistics.qc) == null ? void 0 : _v.total) > 0 ? {
    w: common_vendor.t(Math.round($data.statistics.qc.pass_count / $data.statistics.qc.total * 100))
  } : {}, {
    x: $data.statistics.dailyBlade && $data.statistics.dailyBlade.length > 0
  }, $data.statistics.dailyBlade && $data.statistics.dailyBlade.length > 0 ? {
    y: common_vendor.f($data.statistics.dailyBlade, (item, index, i0) => {
      return {
        a: common_vendor.t($options.formatDate(item.date)),
        b: $options.getBarWidth(item.count) + "%",
        c: common_vendor.t(item.count),
        d: index
      };
    })
  } : {}, {
    z: !$data.loading && Object.keys($data.statistics).length === 0
  }, !$data.loading && Object.keys($data.statistics).length === 0 ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-fc23ec97"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/statistics/statistics.js.map
