"use client";

import { useState, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";
import { Button } from "@/shared/components/ui/button";
import { Download } from "lucide-react";

export default function QRCodeGenerator({ complexSlug }: { complexSlug: string }) {
    const [publicUrl, setPublicUrl] = useState("");

    useEffect(() => {
        setPublicUrl(`${window.location.origin}/canchas/${complexSlug}`);
    }, [complexSlug]);

    const downloadQRCode = () => {
        const canvas = document.querySelector('#react-qrcode-logo') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas
                .toDataURL("image/png")
                .replace("image/png", "image/octet-stream");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `qr-checancha-${complexSlug}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    if (!publicUrl) return null;

    return (
        <div className="flex flex-col items-center gap-6">
            <QRCode 
                id="react-qrcode-logo"
                value={publicUrl}
                size={200}
                logoImage="/logochecancha.png"
                logoWidth={60}
                logoHeight={60}
                qrStyle="dots"
                eyeRadius={10}
            />
            <Button onClick={downloadQRCode}>
                <Download className="mr-2 h-4 w-4" />
                Descargar QR
            </Button>
        </div>
    );
}

