import moment from 'moment-timezone';

const TZ = 'Asia/Kolkata';

const dateUtils = {
  now: () => moment().tz(TZ).toDate(),

  addDays: (d, days) => moment(d).tz(TZ).add(days, 'days').toDate(),

  format: (d, formatStr = 'YYYY-MM-DD HH:mm:ss') => moment(d).tz(TZ).format(formatStr),
};

export default dateUtils;
