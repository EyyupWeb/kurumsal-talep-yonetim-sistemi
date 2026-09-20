import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/base/db";
import User from "@/features/users/user.model";

function turkishToAscii(str) {
  const map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return str
    .toLowerCase()
    .replace(/[çğıöşü]/g, (ch) => map[ch] || ch)
    .replace(/[^a-z0-9.]/g, "");
}

function generateEmail(name, surname) {
  return `${turkishToAscii(name)}.${turkishToAscii(surname)}@internationalplus.com`;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 403 });
    }

    const { name, surname, password } = await request.json();

    if (!name?.trim() || !surname?.trim() || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    await dbConnect();

    const email = generateEmail(name.trim(), surname.trim());

    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
      role: "employee",
      name: name.trim(),
      surname: surname.trim(),
    });

    return NextResponse.json(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        surname: user.surname,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
