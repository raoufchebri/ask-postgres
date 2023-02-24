import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { query, answer, suggestedAnswer, feedback } = req.body;

    if (!query || !answer) {
      return res
        .status(400)
        .json({ message: 'Question and answer are required' });
    }

    const client = await pool.connect();
    const pgQuery =
      'INSERT INTO openai_ft_data (query, answer, suggested_answer, user_feedback) VALUES ($1, $2, $3, $4)';
    const values = [query, answer, suggestedAnswer, feedback];

    await client.query(pgQuery, values);

    client.release();
    return res.status(200).json({ message: 'Data added successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error adding data' });
  }
};
