import mongoose from "mongoose";
import User from "./User.js";
import Lob from "./Lob.js";
import Activity from "./Activity.js";
import Record from "./Record.js";
import Interaction from "./Interaction.js";
import Disposition from "./Disposition.js";
import SubDisposition from "./SubDisposition.js";
import Callback from "./Callback.js";
import Audit from "./Audit.js";
import Otp from "./Otp.js";
import UploadJob from "./UploadJob.js";
import TimeEntry from "./TimeEntry.js";
import LoginLog from "./LoginLog.js";

const db = {
  User,
  Lob,
  Activity,
  Record,
  Interaction,
  Disposition,
  SubDisposition,
  Callback,
  Audit,
  Otp,
  UploadJob,
  TimeEntry,
  LoginLog,
  mongoose,
};

export default db;
