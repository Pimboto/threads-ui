import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"

export async function GET() {
  try {
    await connectToDatabase()
    const users = await User.find({})
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await connectToDatabase()

    const user = await User.create(body)
    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al crear usuario",
      },
      { status: 400 },
    )
  }
}

