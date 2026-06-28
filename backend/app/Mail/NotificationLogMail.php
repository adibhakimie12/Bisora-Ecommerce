<?php

namespace App\Mail;

use App\Models\NotificationLog;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NotificationLogMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly NotificationLog $log)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->log->subject ?: 'Bisora notification',
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.notification-log',
            with: [
                'messageText' => $this->log->message,
            ],
        );
    }
}
