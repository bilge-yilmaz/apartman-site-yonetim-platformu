"use client"

import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Badge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@tremor/react"

const payments = [
  {
    id: 1,
    daire: "A-101",
    sakin: "Ahmet Yılmaz",
    tutar: 750,
    tarih: new Date(2024, 2, 1),
    durum: "Ödendi",
  },
  {
    id: 2,
    daire: "B-204",
    sakin: "Ayşe Kaya",
    tutar: 750,
    tarih: new Date(2024, 2, 1),
    durum: "Bekliyor",
  },
  {
    id: 3,
    daire: "C-302",
    sakin: "Mehmet Demir",
    tutar: 750,
    tarih: new Date(2024, 2, 1),
    durum: "Gecikmiş",
  },
]

export function AidatTable() {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Daire</TableHeaderCell>
          <TableHeaderCell>Sakin</TableHeaderCell>
          <TableHeaderCell>Tutar</TableHeaderCell>
          <TableHeaderCell>Tarih</TableHeaderCell>
          <TableHeaderCell>Durum</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{payment.daire}</TableCell>
            <TableCell>{payment.sakin}</TableCell>
            <TableCell>₺{payment.tutar}</TableCell>
            <TableCell>
              {format(payment.tarih, "d MMMM yyyy", { locale: tr })}
            </TableCell>
            <TableCell>
              <Badge
                color={
                  payment.durum === "Ödendi"
                    ? "emerald"
                    : payment.durum === "Bekliyor"
                    ? "amber"
                    : "red"
                }
              >
                {payment.durum}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
