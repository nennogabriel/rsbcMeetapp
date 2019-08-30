import {
  startOfHour,
  parseISO,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const where = {};
    const page = req.query.page || 1;
    const perPage = 10;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    if (req.query.only) {
      if (req.query.only === 'mine') {
        where.user_id = req.userId;
      } else {
        where.user_id = { [Op.not]: req.userId };
      }
    }

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
          'You can not create a meetup in past without an (Y) (flux capacitor)',
      });
    }

    const user_id = req.userId;

    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);
    if (req.userId !== meetup.user_id) {
      return res
        .status(400)
        .json({ error: 'Only the owner of the meetup can change stuff.' });
    }
    meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);
    if (req.userId !== meetup.user_id) {
      return res
        .status(400)
        .json({ error: 'Only the owner of the meetup can delete.' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'can delete past meetups... (Y) have you?' });
    }

    await meetup.destroy();

    return res.json({ sucess: "I'll (not) be back." });
  }
}

export default new MeetupController();
