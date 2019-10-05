import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';
import File from '../models/File';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: { date: { [Op.gt]: new Date() } },
          attributes: [
            'id',
            'title',
            'description',
            'location',
            'date',
            'past',
            'file_id',
            'user_id',
          ],
          include: [
            { model: User, attributes: ['name', 'email'] },
            { model: File, attributes: ['name', 'path', 'url'] },
          ],
        },
      ],
      order: [[Meetup, 'date']],
    });
    return res.json(subscriptions);
  }

  async store(req, res) {
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [User],
    });
    if (!meetup) {
      return res.status(400).json({ error: 'meetup not found' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'You can not subiscribe to this meetup now. (Y)' });
    }

    const checkDate = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: 'have you heard about Pauli exclusion principle?' });
    }

    const subscription = await Subscription.create({
      meetup_id: meetup.id,
      user_id: req.userId,
    });

    const user = await User.findByPk(req.userId);

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }

  async delete(req, res) {
    const subscription = await Subscription.findByPk(req.params.id, {
      include: [Meetup],
    });
    if (!subscription) {
      return res.status(400).json({ error: 'subscription not found' });
    }

    if (subscription.Meetup.past) {
      return res
        .status(400)
        .json({ error: 'You can not unsubiscribe to this meetup now. (Y)' });
    }

    await subscription.destroy();

    return res.json({ sucess: "I'll (not) be back." });
  }
}

export default new SubscriptionController();
