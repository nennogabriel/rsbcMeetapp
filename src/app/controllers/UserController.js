import User from '../models/Users';

class UserControler {
  async store(req, res) {
    const { id, name, email, provider } = await User.create(req.body);
    return res.json({ id, name, email, provider });
  }
}

export default new UserControler();
