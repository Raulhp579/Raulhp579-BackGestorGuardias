<?php

namespace App\Mail;

use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use League\CommonMark\Extension\Embed\Embed;

class MailableConfig extends Mailable
{
    use Queueable, SerializesModels;

    private $remitente;
    private $asunto;
    private $cuerpo;
    private $attachmentData;
    private $attachmentName;

    public function __construct(string $remitente, string $asunto, string $cuerpo, ?string $attachmentData = null, ?string $attachmentName = null)
    {
        $this->remitente = $remitente;
        $this->asunto = $asunto;
        $this->cuerpo = $cuerpo;
        $this->attachmentData = $attachmentData;
        $this->attachmentName = $attachmentName;
    }

public function build()
{
    try{
        $mail = $this->subject($this->asunto)
            ->view('Mail')
            ->with([
                'cuerpo'=>$this->cuerpo,
                'asunto'=>$this->asunto,
                'remitente'=>$this->remitente
            ]);

        if ($this->attachmentData) {
            $mail->attachData($this->attachmentData, $this->attachmentName ?? 'plantilla.pdf', [
                'mime' => 'application/pdf',
            ]);
        }

        return $mail;
    }catch(Exception $e){
        return response()->json(["error"=>"error al enviar el correo",
                                    "fallo"=>$e->getMessage()]);
    }

}

}