const { API_BASE } = require('../config.js');
const app = getApp();

const TEMPLATE_IDS = {
  medication: 'qwwzrO2x2bn22626PkrYUhfAsOcuJx4_pH0oi8AWluw',
  todo: 'bEwgwdEaBN8PbgLPfPFTiS4c53b9yTILQMvXzt_6sJs',
  followup: '-B-VP0m2Q6fO6ddwBzdyzYlt6umvrZbkia_DgvOS7BU',
};

function combineDateTime(dateStr, timeStr) {
  return `${dateStr} ${timeStr}`;
}

function requestSubscribe(tmplIds) {
  return new Promise((resolve) => {
    wx.requestSubscribeMessage({
      tmplIds,
      success: (res) => resolve(res),
      fail: () => resolve({}),
    });
  });
}

async function scheduleMedicationReminder({ name, dosage, unit, stock, date, time }) {
  await requestSubscribe([TEMPLATE_IDS.medication]);
  const send_time = combineDateTime(date, time);

  const data = {
    thing1: { value: name },
    thing3: { value: `${dosage}${unit}` },
    number13: { value: String(stock) },
    time15: { value: send_time },
  };

  return wx.request({
    url: `${API_BASE}/subscriptions`,
    method: 'POST',
    header: app.getAuthHeader(),
    data: {
      template_id: TEMPLATE_IDS.medication,
      data,
      page: 'pages/index/index',
      send_time,
    },
  });
}

async function scheduleTodoReminder({ title, datetime, description }) {
  await requestSubscribe([TEMPLATE_IDS.todo]);
  const [date, time] = datetime.split(' ');
  const data = {
    thing1: { value: title },
    date2: { value: datetime },
    thing3: { value: description || '' },
  };

  return wx.request({
    url: `${API_BASE}/subscriptions`,
    method: 'POST',
    header: app.getAuthHeader(),
    data: {
      template_id: TEMPLATE_IDS.todo,
      data,
      page: 'pages/reminders/index',
      send_time: combineDateTime(date, time),
    },
  });
}

async function scheduleFollowUpReminder({ date, time, location, doctor }) {
  await requestSubscribe([TEMPLATE_IDS.followup]);
  const data = {
    time1: { value: date },
    time2: { value: time },
    thing3: { value: location },
    thing7: { value: doctor },
  };

  return wx.request({
    url: `${API_BASE}/subscriptions`,
    method: 'POST',
    header: app.getAuthHeader(),
    data: {
      template_id: TEMPLATE_IDS.followup,
      data,
      page: 'pages/reminders/index',
      send_time: combineDateTime(date, time),
    },
  });
}

module.exports = {
  scheduleMedicationReminder,
  scheduleTodoReminder,
  scheduleFollowUpReminder,
};
