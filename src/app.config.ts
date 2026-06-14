export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/contracts/index',
    'pages/report/index',
    'pages/mine/index',
    'pages/template-select/index',
    'pages/contract-form/index',
    'pages/compliance-check/index',
    'pages/contract-detail/index',
    'pages/signature/index',
    'pages/negotiation/index',
    'pages/reminder-settings/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1e3a8a',
    navigationBarTitleText: '合同管家',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f8fafc'
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#1e3a8a',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/contracts/index',
        text: '合同'
      },
      {
        pagePath: 'pages/report/index',
        text: '报告'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
