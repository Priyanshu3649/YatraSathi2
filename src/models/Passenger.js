// Passenger Model - psXpassenger table
// Handles passenger data for bookings as per YatraSathi specification

const db = require('../config/db');

class Passenger {
  constructor(data) {
    this.ps_psid = data.ps_psid;
    this.ps_bkid = data.ps_bkid;
    this.ps_fname = data.ps_fname;
    this.ps_lname = data.ps_lname;
    this.ps_age = data.ps_age;
    this.ps_gender = data.ps_gender;
    this.ps_berthpref = data.ps_berthpref;
    this.ps_berthalloc = data.ps_berthalloc;
    this.ps_seatno = data.ps_seatno;
    this.ps_coach = data.ps_coach;
    this.ps_active = data.ps_active || 1;
    this.edtm = data.edtm;
    this.eby = data.eby;
    this.mdtm = data.mdtm;
    this.mby = data.mby;
  }

  // Create new passenger
  static async create(passengerData) {
    const query = `
      INSERT INTO psXpassenger (
        ps_bkid, ps_fname, ps_lname, ps_age, ps_gender, 
        ps_berthpref, ps_berthalloc, ps_seatno, ps_coach, 
        ps_active, edtm, eby, mdtm, mby
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)
    `;
    
    const values = [
      passengerData.ps_bkid,
      passengerData.ps_fname,
      passengerData.ps_lname || null,
      passengerData.ps_age,
      passengerData.ps_gender,
      passengerData.ps_berthpref || null,
      passengerData.ps_berthalloc || null,
      passengerData.ps_seatno || null,
      passengerData.ps_coach || null,
      passengerData.ps_active || 1,
      passengerData.eby || 'system',
      passengerData.mby || 'system'
    ];

    try {
      const [result] = await db.execute(query, values);
      return {
        success: true,
        ps_psid: result.insertId,
        message: 'Passenger created successfully'
      };
    } catch (error) {
      console.error('Error creating passenger:', error);
      throw new Error('Failed to create passenger: ' + error.message);
    }
  }

  // Get passengers by booking ID
  static async getByBookingId(bookingId) {
    const query = `
      SELECT * FROM psXpassenger 
      WHERE ps_bkid = ? AND ps_active = 1 
      ORDER BY ps_psid ASC
    `;

    try {
      const [rows] = await db.execute(query, [bookingId]);
      return {
        success: true,
        passengers: rows.map(row => new Passenger(row))
      };
    } catch (error) {
      console.error('Error fetching passengers:', error);
      throw new Error('Failed to fetch passengers: ' + error.message);
    }
  }

  // Get passenger by ID
  static async getById(passengerId) {
    const query = `
      SELECT * FROM psXpassenger 
      WHERE ps_psid = ? AND ps_active = 1
    `;

    try {
      const [rows] = await db.execute(query, [passengerId]);
      if (rows.length === 0) {
        return { success: false, message: 'Passenger not found' };
      }
      return {
        success: true,
        passenger: new Passenger(rows[0])
      };
    } catch (error) {
      console.error('Error fetching passenger:', error);
      throw new Error('Failed to fetch passenger: ' + error.message);
    }
  }

  // Update passenger
  static async update(passengerId, updateData) {
    const query = `
      UPDATE psXpassenger SET 
        ps_fname = ?, ps_lname = ?, ps_age = ?, ps_gender = ?,
        ps_berthpref = ?, ps_berthalloc = ?, ps_seatno = ?, ps_coach = ?,
        mdtm = NOW(), mby = ?
      WHERE ps_psid = ? AND ps_active = 1
    `;

    const values = [
      updateData.ps_fname,
      updateData.ps_lname || null,
      updateData.ps_age,
      updateData.ps_gender,
      updateData.ps_berthpref || null,
      updateData.ps_berthalloc || null,
      updateData.ps_seatno || null,
      updateData.ps_coach || null,
      updateData.mby || 'system',
      passengerId
    ];

    try {
      const [result] = await db.execute(query, values);
      if (result.affectedRows === 0) {
        return { success: false, message: 'Passenger not found or already inactive' };
      }
      return {
        success: true,
        message: 'Passenger updated successfully'
      };
    } catch (error) {
      console.error('Error updating passenger:', error);
      throw new Error('Failed to update passenger: ' + error.message);
    }
  }

  // Soft delete passenger (set ps_active = 0)
  static async delete(passengerId) {
    const query = `
      UPDATE psXpassenger SET 
        ps_active = 0, mdtm = NOW(), mby = ?
      WHERE ps_psid = ? AND ps_active = 1
    `;

    try {
      const [result] = await db.execute(query, ['system', passengerId]);
      if (result.affectedRows === 0) {
        return { success: false, message: 'Passenger not found or already inactive' };
      }
      return {
        success: true,
        message: 'Passenger deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting passenger:', error);
      throw new Error('Failed to delete passenger: ' + error.message);
    }
  }

  // Create multiple passengers for a booking (batch insert)
  static async createMultiple(bookingId, passengersList, createdBy = 'system') {
    if (!passengersList || passengersList.length === 0) {
      return { success: true, passengers: [], message: 'No passengers to create' };
    }

    const query = `
      INSERT INTO psXpassenger (
        ps_bkid, ps_fname, ps_lname, ps_age, ps_gender, 
        ps_berthpref, ps_berthalloc, ps_seatno, ps_coach, 
        ps_active, edtm, eby, mdtm, mby
      ) VALUES ?
    `;

    const values = passengersList.map(passenger => [
      bookingId,
      passenger.name || passenger.ps_fname,
      passenger.lastName || passenger.ps_lname || null,
      passenger.age || passenger.ps_age,
      passenger.gender || passenger.ps_gender,
      passenger.berthPreference || passenger.ps_berthpref || null,
      passenger.ps_berthalloc || null,
      passenger.ps_seatno || null,
      passenger.ps_coach || null,
      1, // ps_active
      new Date(), // edtm
      createdBy, // eby
      new Date(), // mdtm
      createdBy // mby
    ]);

    try {
      const [result] = await db.query(query, [values]);
      return {
        success: true,
        insertedCount: result.affectedRows,
        firstInsertId: result.insertId,
        message: `${result.affectedRows} passengers created successfully`
      };
    } catch (error) {
      console.error('Error creating multiple passengers:', error);
      throw new Error('Failed to create passengers: ' + error.message);
    }
  }

  // Get passenger count for a booking
  static async getCountByBookingId(bookingId) {
    const query = `
      SELECT COUNT(*) as passenger_count 
      FROM psXpassenger 
      WHERE ps_bkid = ? AND ps_active = 1
    `;

    try {
      const [rows] = await db.execute(query, [bookingId]);
      return {
        success: true,
        count: rows[0].passenger_count
      };
    } catch (error) {
      console.error('Error getting passenger count:', error);
      throw new Error('Failed to get passenger count: ' + error.message);
    }
  }

  // Search passengers by name (for customer master list)
  static async searchByName(searchTerm, customerId = null) {
    let query = `
      SELECT DISTINCT p.ps_fname, p.ps_lname, p.ps_age, p.ps_gender, p.ps_berthpref
      FROM psXpassenger p
      JOIN psXbooking b ON p.ps_bkid = b.bk_bkid
      WHERE p.ps_active = 1 
      AND (p.ps_fname LIKE ? OR p.ps_lname LIKE ?)
    `;
    
    const params = [`%${searchTerm}%`, `%${searchTerm}%`];
    
    if (customerId) {
      query += ` AND b.bk_customerid = ?`;
      params.push(customerId);
    }
    
    query += ` ORDER BY p.ps_fname, p.ps_lname LIMIT 50`;

    try {
      const [rows] = await db.execute(query, params);
      return {
        success: true,
        passengers: rows
      };
    } catch (error) {
      console.error('Error searching passengers:', error);
      throw new Error('Failed to search passengers: ' + error.message);
    }
  }

  // Get passenger statistics
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_passengers,
        COUNT(DISTINCT ps_bkid) as total_bookings_with_passengers,
        AVG(ps_age) as average_age,
        SUM(CASE WHEN ps_gender = 'M' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN ps_gender = 'F' THEN 1 ELSE 0 END) as female_count,
        SUM(CASE WHEN ps_gender NOT IN ('M', 'F') THEN 1 ELSE 0 END) as other_count
      FROM psXpassenger 
      WHERE ps_active = 1
    `;

    try {
      const [rows] = await db.execute(query);
      return {
        success: true,
        statistics: rows[0]
      };
    } catch (error) {
      console.error('Error getting passenger statistics:', error);
      throw new Error('Failed to get passenger statistics: ' + error.message);
    }
  }
}

module.exports = Passenger;