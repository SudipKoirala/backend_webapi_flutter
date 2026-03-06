import nodemailer from 'nodemailer';

const emailPort = Number(process.env.EMAIL_PORT) || 2525;

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
    try {
        const info = await transporter.sendMail({
            from: `"VibeMent" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            text,
            ...(html ? { html } : {}),
        });

        console.log('Message sent: %s', info.messageId);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('Preview URL: %s', previewUrl);
        }
        return info;
    } catch (error: any) {
        console.error('Error sending email:', error.message || error);
        throw new Error('Failed to send email');
    }
};
