import { startOfHour, parseISO, isBefore } from 'date-fns';
import Meetup from '../models/Meetup';

class MeetupController {
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
