// src/app/api/upload/route.ts
import { NextResponse } from 'next/server'
import path from 'path'
import { writeFile } from 'fs/promises'
import { promises as fs } from 'fs'

export async function POST(req: Request) {
  try {
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    await fs.mkdir(uploadDir, { recursive: true })

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const filepath = path.join(uploadDir, filename)
    
    await fs.writeFile(filepath, Buffer.from(buffer))
    
    return NextResponse.json({
      success: true,
      filePath: `/uploads/${filename}`  // Return the public-accessible path
    })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}