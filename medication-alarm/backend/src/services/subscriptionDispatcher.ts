import { SubscriptionModel } from '../models/Subscription';
import { UserModel } from '../models/User';
import { WechatService } from './wechatService';

const fmtNow = () => {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function startSubscriptionDispatcher() {
  const tick = async () => {
    try {
      const due = await SubscriptionModel.findDue(fmtNow());
      for (const sub of due) {
        if (!sub.id) continue; // Ensure id exists

        try {
          const user = await UserModel.findById(sub.user_id);
          if (!user?.openid) {
            await SubscriptionModel.markFailed(sub.id, 'User openid not found');
            continue;
          }
          const result = await WechatService.sendSubscriptionMessage({
            touser: user.openid,
            template_id: sub.template_id,
            page: sub.page || 'pages/index/index',
            data: JSON.parse(sub.data || '{}'),
          });
          await SubscriptionModel.markSent(sub.id, JSON.stringify(result));
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'send failed';
          await SubscriptionModel.markFailed(sub.id, message);
        }
      }
    } catch (_) {
      /* ignore error on purpose for dispatcher robustness */
    }
  };
  // run every 60 seconds
  setInterval(tick, 60 * 1000);
  // immediate first tick
  tick();
}
