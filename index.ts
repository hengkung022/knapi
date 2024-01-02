import { Request, Response } from "express"
const Prisma = require('@prisma/client')
const prisma = new Prisma.PrismaClient();
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
require('dotenv').config()
app.use(express.json()); 

app.get('/', async (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.get('/building', async (req: Request, res: Response) => {
    const building = await prisma.building.findMany(
        {
            include: {
                Restaurant: {
                include: {
                    Bill: {
                        orderBy: {
                            Date: 'desc'
                        }
                    }
                }
            }
        }
        }
    )
    res.json({building})
})

app.get('/building/restaurant', async (req: Request, res: Response) => {
    const { id } = req.params
    const building = await prisma.restaurant.findMany(
        {
            include: {
                Bill: true
            }
        }   
    
    )
    res.json({building})
})

app.get('/building/restaurant/:id', async (req: Request, res: Response) => {
    const { id } = req.params
    const Bill = await prisma.restaurant.findMany(
        {
            where: {
                id: parseInt(id)
            },include: {
                Bill: true
            }
        }   
    
    )
    res.json({restaurant: Bill})
})

app.post('/bill', async (req: Request, res: Response) => {
    const { Restaurantid, Date, start, end ,mea,sch} = req.body;
    try {
      const newBill = await prisma.Bill.create({
        data: {
          Restaurantid,
          Date,
          start,
          end,mea,sch
        }
      });
      res.status(201).json(newBill);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while creating the bill.' });
    }
  });

  interface Bill {
    id: number;
    Date: Date;
    start: number;
    end: number;
    sch:number;
    mea:number;
    Restaurantid: number;
  }
  app.get('/yearlybill/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const yearlybill = await prisma.Bill.findMany({
        where: {
            Restaurantid: parseInt(id)
        }
    });

    const transformedYearlybill = yearlybill.map((bill:Bill) => ({
        
        ...bill,
        Date: new Date(bill.Date).toLocaleString('en-GB', { month: 'short', year: '2-digit' }),
        คิดตามหน่วยโรงเรียน: (bill.sch * (bill.end - bill.start)).toFixed(2),
        คิดหน่วยการไฟฟ้า: ((bill.end - bill.start) * bill.mea).toFixed(2) ,
    }));

    res.json(transformedYearlybill);
});

app.get('/totalyearlybill', async (req: Request, res: Response) => {
    const yearlybill = await prisma.Bill.findMany();
    const groupedYearlybill = yearlybill.reduce((acc: any[], bill: Bill) => {
        const date = new Date(bill.Date).toLocaleString('en-GB', { month: 'short', year: '2-digit' });
        let dateIndex = acc.findIndex(item => item.date === date);
        if (dateIndex === -1) {
            acc.push({
                date,
                คิดตามหน่วยโรงเรียน: parseFloat((bill.sch * (bill.end - bill.start)).toFixed(2)),
                คิดหน่วยการไฟฟ้า: parseFloat(((bill.end - bill.start) * bill.mea).toFixed(2)),
            });
        } else {
            acc[dateIndex].คิดตามหน่วยโรงเรียน += parseFloat((bill.sch * (bill.end - bill.start)).toFixed(2));
            acc[dateIndex].คิดหน่วยการไฟฟ้า += parseFloat(((bill.end - bill.start) * bill.mea).toFixed(2));
        }
        return acc;
    }, []);
    
    res.json(groupedYearlybill);
});


app.post('/updaterestaurant', async (req: Request, res: Response) => {
    const { id, name} = req.body;
    try {
      const updateRestaurant = await prisma.restaurant.update({
        where: {
          id: parseInt(id)
        },
        data: {
          name,
        }
      });
      res.status(201).json(updateRestaurant);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while updating the restaurant.' });
    }
  }
);
app.get('/getbillrestaurant/:id', async (req: Request, res: Response) => {
    const {id} = req.params;
    try {
        const bills = await prisma.Bill.findMany({
            where: {
                Restaurantid: parseInt(id)
              },
              orderBy: {
                  Date: 'asc' // 'asc' for ascending, 'desc' for descending
              }
        });

        const updatedBills = bills.map((bill:Bill) => ({
            ...bill,
            Date: new Date(bill.Date).toLocaleDateString('en-GB')
        }));

        res.status(201).json(updatedBills);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating the restaurant.' });
    }
});
app.get('/allbillrestaurant/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const yearlybill = await prisma.Bill.findMany({
        where: {
            Restaurantid: parseInt(id)
        }
    });
    return yearlybill;
});
app.post('/getbillbill/:id', async (req: Request, res: Response) => {
    const id = req.params.id;
    const formData = req.body;
        try {
      const updateBill = await prisma.Bill.update({
        where: {
          id: parseInt(id)
        },
        data: {
            formData
        }
      });
      res.status(201).json(updateBill);
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);
app.delete('/deletebill/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const deleteBill = await prisma.Bill.delete({
            where: {
                id: parseInt(id),
            },
        });
        res.status(200).json({ message: 'Bill deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while deleting the bill.' });
    }
});

app.post('/updatebillres', async (req:Request, res:Response) => {
    const updatedFormData:Bill = req.body;
    console.log(updatedFormData);
    try {
      const updatedBill = await prisma.bill.update({
        where: { id: updatedFormData.id },
        data: updatedFormData,
      });
  
      res.status(200).json({ message: 'Bill updated successfully', bill: updatedBill });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while updating the bill' });
    }
  });

app.listen(3003, () => {
    console.log('Example app listening on port', process.env.PORT);
})