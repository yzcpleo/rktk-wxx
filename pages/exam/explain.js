const app = app || getApp();
const zutils = require('../../utils/zutils.js');

import { zsharebox } from '../comps/z-sharebox.js';
zsharebox.data.typeName = '考题';

Page({
  data: {
    shareboxData: zsharebox.data,
    viewId: 'question',
    currentQuestionId: null,
    hideNos: true
  },
  questionId: null,  // for share
  qcached: {},
  qosid: null,
  answerKey: null,

  onLoad: function (e) {
    if (!e.id && e.id.length != 20) {
      app.goHome();
      return;
    }

    this.answerKey = e.a;
    this.qosid = e.id;
    var that = this;
    app.getUserInfo(function (u) {
      that.setData({
        user: u.uid
      });

      if (that.qosid.substr(0, 3) == '112') {
        that.setData({
          currentQuestionId: that.qosid
        });
        that.__loadQuestion(e);
      } else {
        zutils.get(app, 'api/subject/subject-qids?subject=' + that.qosid, function (res) {
          that.__qids = res.data.data;
          let idx = 1;
          try {
            idx = wx.getStorageSync('ExplainPageNo' + that.qosid);
            if (idx) {
              idx = ~~idx;
              if (idx < 1 || idx > that.__qids.length) {
                idx = 1;
              }
            } else {
              idx = 1;
            }
          } catch (e) {
          }

          that.setData({
            hideNos: false,
            qidsTotal: that.__qids.length,
            qidsNo: idx,
            currentQuestionId: that.__qids[idx - 1]
          });
          that.__loadQuestion();
        });
      }
    });

    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          viewHeight: res.windowHeight - 40 - (!!that.answerKey ? 44 : 0)
        })
      }
    });
  },

  __loadQuestion: function (idx) {
    this.questionId = this.data.currentQuestionId;
    if (idx && typeof idx == 'number') {
      wx.setStorage({
        key: 'ExplainPageNo' + this.qosid,
        data: idx
      })
    }

    if (this.qcached[this.data.currentQuestionId]) {
      this.setData(this.qcached[this.data.currentQuestionId]);
      return;
    }

    var that = this;
    zutils.get(app, 'api/question/details?id=' + this.data.currentQuestionId, function (res) {
      var _data = res.data.data;
      for (var i = 0; i < _data.answer_list.length; i++) {
        var item = _data.answer_list[i];
        var clazz = _data.answer_key.indexOf(item[0]) > -1 ? 'right' : '';
        if (that.answerKey && that.answerKey.indexOf(item[0]) > -1) {
          clazz += ' selected';
        }
        item[10] = clazz;
        item[11] = item[0].substr(1);
        _data.answer_list[i] = item;
      }

      if (that.answerKey) {
        _data.rightAnswer = that.__formatAnswerKey(_data.answer_key);
        _data.yourAnswer = that.__formatAnswerKey(that.answerKey);
      }
      _data.viewId = 'question';
      that.setData(_data);
      that.qcached[that.data.currentQuestionId] = _data;
    });
  },

  goPrev: function (e) {
    let idx = this.data.qidsNo;
    if (idx <= 1) return;
    idx -= 1;
    this.setData({
      qidsNo: idx,
      currentQuestionId: this.__qids[idx - 1]
    });
    this.__loadQuestion(idx);
  },

  goNext: function (e) {
    let idx = this.data.qidsNo;
    if (idx >= this.__qids.length) return;
    idx += 1;
    this.setData({
      qidsNo: idx,
      currentQuestionId: this.__qids[idx - 1]
    });
    this.__loadQuestion(idx);
  },

  __formatAnswerKey: function (ak) {
    var answer_key = ak.split('/');
    for (var i = 0; i < answer_key.length; i++) {
      var a = answer_key[i].substr(1);
      answer_key[i] = (a == 'X') ? '无' : a;
      if (a == 'ull') {  // null
        answer_key[i] = '未作答';
        answer_key[i] = '无';
      }
    }
    answer_key = answer_key.join(' / ');
    return answer_key;
  },

  fav: function (e) {
    var that = this;
    zutils.post(app, 'api/fav/toggle?question=' + this.data.currentQuestionId, function (res) {
      var _data = res.data.data;
      that.setData({
        isFav: _data.is_fav
      });
      wx.showToast({
        title: _data.is_fav ? '已加入收藏' : '已取消收藏'
      });
    });
  },

  position: function (e) {
    var vid = e.currentTarget.dataset.vid;
    this.setData({
      viewId: vid,
    })
  },

  gotoSubject: function (e) {
    var s = e.currentTarget.dataset.subject;
    app.gotoPage('/pages/question/subject?id=' + s);
  },



  onShareAppMessage: function () {
    var d = app.warpShareData('/pages/exam/explain?id=' + this.data.currentQuestionId);
    d.title = '#考题解析#' + this.data.question.replace('，', '').replace('（', '').replace('）', '').trim().substr(0, 30) + '...';
    return d;
  },

  shareboxOpen: function () {
    zsharebox.shareboxOpen(this);
  },
  shareboxClose: function () {
    zsharebox.shareboxClose(this);
  },
  dialogOpen: function () {
    zsharebox.dialogOpen(this);
  },
  dialogClose: function () {
    zsharebox.dialogClose(this);
  },
  share2Frined: function () {
    zsharebox.share2Frined(this);
  },
  share2QQ: function () {
    zsharebox.share2QQ(this);
  },
  share2CopyLink: function () {
    zsharebox.share2CopyLink(this);
  },

  goVip: function () {
    wx.navigateTo({
      url: '../my/vip-buy'
    })
  }
});