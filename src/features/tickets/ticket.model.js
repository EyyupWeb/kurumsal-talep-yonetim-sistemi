import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    kullaniciAd: {
      type: String,
      required: true,
      trim: true,
    },
    konu: {
      type: String,
      required: true,
      trim: true,
    },
    aciliyet: {
      type: String,
      required: true,
      enum: ["Düşük", "Orta", "Yüksek", "Kritik"],
    },
    durum: {
      type: String,
      default: "Açık",
      enum: ["Açık", "Devam Ediyor", "Çözüldü", "Kapatıldı"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
