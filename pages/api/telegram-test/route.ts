import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required'
        },
        { status: 400 }
      )
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Telegram configuration missing',
          details: {
            hasBotToken: !!botToken,
            hasChatId: !!chatId
          }
        },
        { status: 500 }
      )
    }

    try {
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🧪 *Test Notification*\n\n${message}`,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          })
        }
      )

      const result = await telegramResponse.json()

      if (!telegramResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            error: 'Telegram API error',
            details: result
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully',
        details: {
          messageId: result.result?.message_id,
          timestamp: new Date().toISOString()
        }
      })

    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send Telegram message',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  return NextResponse.json({
    success: true,
    config: {
      hasBotToken: !!botToken,
      hasChatId: !!chatId,
      botTokenLength: botToken?.length || 0,
      chatIdLength: chatId?.length || 0
    },
    message: 'Telegram configuration status'
  })
}
