import Vue from 'vue'
import './plugins/axios'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import VueNativeSock from 'vue-native-websocket'

Vue.config.productionTip = false
Vue.use(VueNativeSock, 'ws://localhost:9090')

/* eslint-disable no-new */
new Vue({
  vuetify,
  router,
  VueNativeSock,
  render: h => h(App)
}).$mount('#app')
