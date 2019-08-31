import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Subscription from '../models/Subscription';

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
            'title',
            'description',
            'location',
            'date',
            'past',
            'file_id',
            'user_id',
          ],
          include: [
            {
              model: User,
              attributes: ['name', 'email'],
            },
          ],
        },
      ],
      order: [[Meetup, 'date']],
    });
    return res.json(subscriptions);
  }

  async store(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);
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
    return res.json(subscription);
  }
}

export default new SubscriptionController();
