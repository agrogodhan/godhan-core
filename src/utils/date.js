import moment from "moment-timezone";

const dateUtils = {
  // Returns current IST datetime as a JS Date object
  now: () => {
    return moment().tz("Asia/Kolkata").toDate();
  },

  // Adds days and returns IST Date object
  addDays: (d, days) => {
    return moment(d)
      .tz("Asia/Kolkata")
      .add(days, "days")
      .toDate();
  },

  // Format IST date into readable string
  format: (d, formatStr = "YYYY-MM-DD HH:mm:ss") => {
    return moment(d).tz("Asia/Kolkata").format(formatStr);
  }
};

export default dateUtils;
