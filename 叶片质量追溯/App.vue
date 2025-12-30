<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			
			// 检查登录状态
			const token = uni.getStorageSync('token')
			const userInfo = uni.getStorageSync('userInfo')
			
			if (!token || !userInfo) {
				// 未登录，跳转到登录页
				setTimeout(() => {
					uni.reLaunch({
						url: '/pages/login/login'
					})
				}, 100)
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	page {
		background-color: #FFFFFF;
	}
	
	/* 全局样式 */
	.container {
		min-height: 100vh;
		background: #FFFFFF;
	}
</style>
