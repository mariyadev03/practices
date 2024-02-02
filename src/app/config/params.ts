/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-11
 */

export default async function (): Promise<{ [key: string]: any }> {
  return {
    adminEmail: 'admin@example.com',
    senderEmail: 'noreply@example.com',
    senderName: 'Example.com mailer',
  };
}
