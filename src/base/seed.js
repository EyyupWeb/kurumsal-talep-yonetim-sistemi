const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;

const TicketSchema = new mongoose.Schema(
  {
    kullaniciAd: { type: String, required: true, trim: true },
    konu: { type: String, required: true, trim: true },
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
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },
    name: { type: String, required: true, trim: true },
    surname: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const seedTickets = [
  {
    kullaniciAd: "Ahmet Yılmaz",
    konu: "2. kattaki yazıcı çalışmıyor, baskı kuyruğu sürekli takılıyor.",
    aciliyet: "Yüksek",
    durum: "Açık",
  },
  {
    kullaniciAd: "Elif Demir",
    konu: "VPN bağlantısı kurulamıyor, uzak masaüstüne erişim sağlanamıyor.",
    aciliyet: "Kritik",
    durum: "Devam Ediyor",
  },
  {
    kullaniciAd: "Mehmet Kaya",
    konu: "Outlook e-posta senkronizasyonu durdu, yeni mailler gelmiyor.",
    aciliyet: "Orta",
    durum: "Açık",
  },
  {
    kullaniciAd: "Zeynep Arslan",
    konu: "Yeni başlayan personel için kullanıcı hesabı ve erişim yetkileri oluşturulması gerekiyor.",
    aciliyet: "Düşük",
    durum: "Çözüldü",
  },
  {
    kullaniciAd: "Can Öztürk",
    konu: "Toplantı odasındaki projeksiyon cihazı görüntü vermiyor, HDMI bağlantısı kontrol edilmeli.",
    aciliyet: "Yüksek",
    durum: "Açık",
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  await Ticket.deleteMany({});
  const createdTickets = await Ticket.insertMany(seedTickets);
  console.log(`${createdTickets.length} adet talep basariyla eklendi.`);

  await User.deleteMany({});
  const hashedPassword = await bcrypt.hash("123", 10);
  await User.create({
    email: "it@internationalplus.com",
    password: hashedPassword,
    role: "admin",
    name: "IT",
    surname: "Admin",
  });
  console.log("Varsayilan admin hesabi olusturuldu: it@internationalplus.com / 123");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed hatasi:", err);
  process.exit(1);
});
