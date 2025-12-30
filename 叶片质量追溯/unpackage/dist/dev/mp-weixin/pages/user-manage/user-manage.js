"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_storage = require("../../utils/storage.js");
const _sfc_main = {
  data() {
    return {
      userList: [],
      loading: false,
      showModal: false,
      editingUser: null,
      submitting: false,
      form: {
        operator_name: "",
        role: "OPERATOR",
        password: "",
        is_active: 1
      },
      roleOptions: [
        { value: "OPERATOR", label: "操作员" },
        { value: "QC", label: "质检员" },
        { value: "ADMIN", label: "管理员" }
      ],
      roleIndex: 0
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
    this.loadUserList();
  },
  methods: {
    async loadUserList() {
      this.loading = true;
      try {
        const res = await utils_request.get("/user/list");
        if (res && res.data) {
          this.userList = res.data.list || [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user-manage/user-manage.vue:173", "加载用户列表失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    showAddModal() {
      this.editingUser = null;
      this.form = {
        operator_name: "",
        role: "OPERATOR",
        password: "",
        is_active: 1
      };
      this.roleIndex = 0;
      this.showModal = true;
    },
    editUser(user) {
      this.editingUser = user;
      this.form = {
        operator_name: user.operator_name,
        role: user.role,
        password: "",
        is_active: user.is_active
      };
      this.roleIndex = this.roleOptions.findIndex((r) => r.value === user.role);
      if (this.roleIndex === -1)
        this.roleIndex = 0;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.editingUser = null;
    },
    onRoleChange(e) {
      this.roleIndex = parseInt(e.detail.value);
      this.form.role = this.roleOptions[this.roleIndex].value;
    },
    async handleSubmit() {
      var _a;
      if (!this.form.operator_name || !this.form.operator_name.trim()) {
        common_vendor.index.showToast({
          title: "请输入工号或姓名",
          icon: "none"
        });
        return;
      }
      this.submitting = true;
      try {
        if (this.editingUser) {
          await utils_request.put(`/user/${this.editingUser.operator_id}`, this.form);
          common_vendor.index.showToast({
            title: "更新成功",
            icon: "success"
          });
        } else {
          await utils_request.post("/user", this.form);
          common_vendor.index.showToast({
            title: "创建成功",
            icon: "success"
          });
        }
        this.closeModal();
        this.loadUserList();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user-manage/user-manage.vue:248", "操作失败:", error);
        const errorMsg = error.message || ((_a = error.data) == null ? void 0 : _a.message) || "操作失败";
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.submitting = false;
      }
    },
    async toggleUserStatus(user) {
      common_vendor.index.showModal({
        title: "确认",
        content: `确定要${user.is_active ? "停用" : "启用"}该用户吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await utils_request.put(`/user/${user.operator_id}`, {
                is_active: user.is_active ? 0 : 1
              });
              common_vendor.index.showToast({
                title: "操作成功",
                icon: "success"
              });
              this.loadUserList();
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/user-manage/user-manage.vue:276", "操作失败:", error);
              common_vendor.index.showToast({
                title: "操作失败",
                icon: "none"
              });
            }
          }
        }
      });
    },
    getRoleText(role) {
      const roleMap = {
        "OPERATOR": "操作员",
        "QC": "质检员",
        "ADMIN": "管理员"
      };
      return roleMap[role] || role;
    },
    getRoleClass(role) {
      const classMap = {
        "OPERATOR": "role-operator",
        "QC": "role-qc",
        "ADMIN": "role-admin"
      };
      return classMap[role] || "";
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.showAddModal && $options.showAddModal(...args)),
    b: common_vendor.f($data.userList, (user, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(user.operator_name),
        b: common_vendor.t($options.getRoleText(user.role)),
        c: common_vendor.n($options.getRoleClass(user.role)),
        d: common_vendor.t(user.is_active ? "启用" : "停用"),
        e: common_vendor.n(user.is_active ? "active" : "inactive"),
        f: common_vendor.o(($event) => $options.editUser(user), index),
        g: user.is_active
      }, user.is_active ? {
        h: common_vendor.o(($event) => $options.toggleUserStatus(user), index)
      } : {
        i: common_vendor.o(($event) => $options.toggleUserStatus(user), index)
      }, {
        j: index
      });
    }),
    c: $data.userList.length === 0 && !$data.loading
  }, $data.userList.length === 0 && !$data.loading ? {} : {}, {
    d: $data.showModal
  }, $data.showModal ? common_vendor.e({
    e: common_vendor.t($data.editingUser ? "编辑用户" : "添加用户"),
    f: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args)),
    g: $data.form.operator_name,
    h: common_vendor.o(($event) => $data.form.operator_name = $event.detail.value),
    i: common_vendor.t($data.roleOptions[$data.roleIndex].label),
    j: $data.roleOptions,
    k: $data.roleIndex,
    l: common_vendor.o((...args) => $options.onRoleChange && $options.onRoleChange(...args)),
    m: common_vendor.t($data.editingUser ? "（留空不修改）" : "（留空默认123456）"),
    n: $data.editingUser ? "留空则不修改密码" : "留空则使用默认密码123456",
    o: $data.form.password,
    p: common_vendor.o(($event) => $data.form.password = $event.detail.value),
    q: $data.editingUser
  }, $data.editingUser ? {
    r: $data.form.is_active ? 1 : "",
    s: common_vendor.o(($event) => $data.form.is_active = true),
    t: !$data.form.is_active ? 1 : "",
    v: common_vendor.o(($event) => $data.form.is_active = false)
  } : {}, {
    w: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args)),
    x: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args)),
    y: $data.submitting,
    z: common_vendor.o(() => {
    }),
    A: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4efd6caa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user-manage/user-manage.js.map
