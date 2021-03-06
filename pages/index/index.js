const app = app || getApp();
const zutils = require('../../utils/zutils.js');

Page({
  data: {
    hideBanners: false
  },

  onLoad: function (e) {
    let that = this;
    zutils.get(app, 'api/home/comdata', function (res) {
      let _data = res.data.data;
      if (!_data.banners || _data.banners.length == 0) {
        that.setData({
          hideBanners: true
        });
      } else {
        that.setData({
          banners: _data.banners
        });
      }

      //app.showReddot(2, 'Home180201NEWMY');
    });

    app.getUserInfo(function () {
      that.__loadRecent();
      that.__loadRecommend();
      that.__checkTwxx();
      app.__checkToken();
    });

    wx.getStorage({
      key: 'FOLLOW_SUBJECT',
      success: function (res) {
        let fs = res.data.split(',');
        app.GLOBAL_DATA.FOLLOW_SUBJECT = fs;
        if (fs.length > 0) {
          that.__loadFollowSubject(fs);
        }
      }
    })
  },

  onPullDownRefresh: function () {
    this.onLoad();
    setTimeout(function () {
      wx.stopPullDownRefresh();
    }, 800);
  },

  onShow: function () {
    if (zutils.array.inAndErase(app.GLOBAL_DATA.RELOAD_EXAM, 'Index')) {
      this.__loadRecent();
    }
    if (zutils.array.inAndErase(app.GLOBAL_DATA.RELOAD_SUBJECT, 'Index')) {
      this.__loadRecommend();
    }

    let fs = app.GLOBAL_DATA.FOLLOW_SUBJECT;
    if (fs && fs.length > 0) {
      let lastFs = fs[fs.length - 1];
      if (lastFs != this.__lastFs) {
        this.__loadFollowSubject(fs);
      }
    }
  },

  // 最近关注题库
  __loadFollowSubject: function (fs) {
    if (!fs || fs.length < 3) return;
    this.__lastFs = fs[fs.length - 1];
    let that = this;
    zutils.get(app, 'api/home/subject-names?ids=' + fs.join(','), function (res) {
      if (res.data && res.data.data && res.data.data.length > 0) {
        let _subjects = res.data.data;
        _subjects.reverse();
        that.__formatSubject(_subjects);
        that.setData({
          followSubjects: _subjects
        });
      }
    });
  },

  // 解析分享来源
  __checkTwxx: function () {
    var q = app.__enter_source.query.q || app.__enter_source.query.scene;
    if (q && decodeURIComponent(q).indexOf('/t/wxx/') > -1) {
      zutils.get(app, 'api/share/parse-twxx?q=' + q, function (res) {
        if (res.data.error_code == 0) {
          wx.navigateTo({
            url: res.data.data
          })
        }
      });
    }
  },

  // 最近答题
  __loadRecent: function () {
    var that = this;
    zutils.get(app, 'api/home/recent-exams', function (res) {
      that.setData(res.data.data);
    });
  },

  // 推荐题库
  __loadRecommend: function () {
    let that = this;
    zutils.get(app, 'api/home/recommend-subjects', function (res) {
      let _data = res.data.data;
      if (!_data) return;
      let _subjects = _data.recommend_subjects;
      that.__formatSubject(_subjects);
      if (_subjects.length > 3) {
        _data.recommend_subjects = [_subjects[0], _subjects[1], _subjects[2]];
        _data.recommend_subjects2 = [_subjects[3], _subjects[4], _subjects[5]];
      } else {
        _data.recommend_subjects2 = null;
      }
      that.setData(_data);
    });
  },

  __formatSubject: function (_subjects) {
    for (var i = 0; i < _subjects.length; i++) {
      var sname = _subjects[i][1];
      _subjects[i][10] = sname.substr(0, 7);
      _subjects[i][11] = sname.substr(7);
      if (sname.indexOf('下午题') > -1) {
        _subjects[i][12] = 'T2';
        if (sname.indexOf('Ⅱ') > -1) {
          _subjects[i][12] = 'T3';
        }
      }
      if (_subjects[i][3] == 2) {
        _subjects[i][12] = 'T4';
        _subjects[i][10] = '知识点';
        _subjects[i][11] = null;
        _subjects[i][2] = _subjects[i][1];
      }
    }
  },

  todayExam: function (e) {
    var that = this;
    zutils.post(app, 'api/exam/today-exam?formId=' + (e.detail.formId || ''), function (res) {
      if (res.data.error_code == 0) {
        var data = res.data.data;
        wx.navigateTo({
          url: '../exam/exam?subject=' + data.subject_id + '&exam=' + data.exam_id
        })
      } else {
        var error_msg = res.data.error_msg || '系统错误';
        if (error_msg.indexOf('考试类型') > -1 || error_msg.indexOf('尚未选择') > -1) {
          wx.navigateTo({
            url: '../question/subject-choice?back=1'
          });
        } else {
          wx.showModal({
            title: '提示',
            content: error_msg,
            showCancel: false
          });
        }
      }
    });
  },

  signin: function (e) {
    zutils.post(app, 'api/home/signin?noloading&formId=' + (e.detail.formId || ''), function (res) {
      var _data = res.data;
      if (_data.error_code == 0) {
        app.GLOBAL_DATA.RELOAD_COIN = ['Home'];
        wx.showToast({
          title: _data.data || '签到成功',
          icon: 'success'
        });
      } else {
        wx.showModal({
          title: '提示',
          content: _data.error_msg || '系统错误',
          showCancel: false
        })
      }
    });
  },

  goSubjectList: function () {
    wx.switchTab({
      url: '/pages/question/subject-list'
    })
  },

  bannerChange: function (e) {
    console.log(e);
  },

  gotoPage: function (e) {
    if (e.detail && e.detail.formId) {
      zutils.post(app, 'api/user/report-formid?formId=' + e.detail.formId);
    }
    app.gotoPage(e.currentTarget.dataset.url);
  },

  onShareAppMessage: function () {
    return app.warpShareData();
  }
})