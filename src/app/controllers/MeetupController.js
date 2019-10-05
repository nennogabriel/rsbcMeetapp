import {
  startOfHour,
  parseISO,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';
import * as Yup from 'yup';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';
import Subscription from '../models/Subscription';

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
      include: [
        { model: User, attributes: ['name', 'email'] },
        { model: File, attributes: ['name', 'path', 'url'] },
        { model: Subscription, where: { user_id: req.userId } },
      ],
      limit: perPage,
      offset: perPage * page - perPage,
    });
    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const meetupHour = startOfHour(parseISO(req.body.date));
    if (isBefore(meetupHour, new Date())) {
      return res.status(400).json({
        error:
          'You can not create a meetup in past without an (Y) (flux capacitor)',
      });
    }

    const user_id = req.userId;

    req.body.date = meetupHour;

    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);
    if (!meetup) {
      return res.status(404).json({ error: 'Meetup não encontrado.' });
    }
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
