import { startOfHour, parseISO, isBefore } from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const where = { [Op.not]: { user_id: req.userId } };
    const page = req.query.page || 1;
    const perPage = 20;

    const meetups = await Meetup.findAll({
      where,
      include: [{ model: User, attributes: ['name', 'email'] }],
      limit: perPage,
      offset: perPage * page - perPage,
    });
    return res.json(meetups);
  }

  async store(req, res) {
    const meetupHour = startOfHour(parseISO(req.body.date));
    if (isBefore(meetupHour, new Date())) {
      return res.status(400).json({
        error:
          'You can not create a meetup in past without an Y (flux capacitor)',
      });
    }

    const user_id = req.userId;

    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json(meetup);
  }
}

export default new MeetupController();
