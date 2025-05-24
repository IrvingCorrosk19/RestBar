import { Request, Response } from 'express';
import { Table } from '../models/table.model';

class TableController {
  async updatePosition(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { x, y } = req.body;
      const table = await Table.findByPk(id);
      if (!table) {
        return res.status(404).json({ message: 'Mesa no encontrada' });
      }
      await table.update({ x, y });
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar la posición de la mesa' });
    }
  }
}

export default new TableController(); 