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

    public function __construct(string $remitente, string $asunto, string $cuerpo)
    {
        $this->remitente = $remitente;
        $this->asunto = $asunto;
        $this->cuerpo = $cuerpo;
        
    }

public function build()
{
    try{
        return $this->subject($this->asunto)
            ->view('Mail')
            ->with([
                'cuerpo'=>$this->cuerpo,
                'asunto'=>$this->asunto,
                'remitente'=>$this->remitente
            ]);
    }catch(Exception $e){
        return response()->json(["error"=>"error al enviar el correo",
                                    "fallo"=>$e->getMessage()]);
    }
    
}

}