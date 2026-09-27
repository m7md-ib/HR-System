import Link from "next/link";
import { getServerDictionary } from "@/i18n/server";
import { getEmployeeProfileData } from "@/lib/queries/employee-profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { DurationBadge } from "@/components/duration-badge";
import { formatDate, formatTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";

export async function EmployeeProfileTabs({ employeeId }: { employeeId: string }) {
  const { dict } = await getServerDictionary();
  const data = await getEmployeeProfileData(employeeId);

  return (
    <Tabs defaultValue="attendance" className="mt-2">
      <TabsList className="flex-wrap">
        <TabsTrigger value="attendance">{dict.employees.tabs.attendance}</TabsTrigger>
        <TabsTrigger value="payroll">{dict.employees.tabs.payroll}</TabsTrigger>
        <TabsTrigger value="advances">{dict.employees.tabs.advances}</TabsTrigger>
        <TabsTrigger value="deductions">{dict.employees.tabs.deductions}</TabsTrigger>
        <TabsTrigger value="bonuses">{dict.employees.tabs.bonuses}</TabsTrigger>
        <TabsTrigger value="overtime">{dict.employees.tabs.overtime}</TabsTrigger>
        <TabsTrigger value="expenses">{dict.employees.tabs.expenses}</TabsTrigger>
        <TabsTrigger value="leave">{dict.employees.tabs.leave}</TabsTrigger>
        <TabsTrigger value="ledger">{dict.employees.tabs.ledger}</TabsTrigger>
      </TabsList>

      <TabsContent value="attendance">
        {data.attendance.length === 0 ? <EmptyState title={dict.common.noData} /> : (
          <Table>
            <THead><TR><TH>{dict.common.date}</TH><TH>{dict.attendance.checkIn}</TH><TH>{dict.attendance.checkOut}</TH><TH>{dict.attendance.netDuration}</TH><TH>{dict.common.status}</TH></TR></THead>
            <TBody>
              {data.attendance.map((a) => (
                <TR key={a.id}>
                  <TD>{formatDate(a.date)}</TD><TD>{formatTime(a.checkIn)}</TD><TD>{formatTime(a.checkOut)}</TD>
                  <TD><DurationBadge minutes={a.workedMinutes} /></TD>
                  <TD><StatusBadge status={a.status} label={dict.statuses.attendanceStatus[a.status]} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="payroll">
        {data.payrollRecords.length === 0 ? <EmptyState title={dict.common.noData} /> : (
          <Table>
            <THead><TR><TH>{dict.payroll.label}</TH><TH>{dict.payroll.grossTotal}</TH><TH>{dict.payroll.netPayable}</TH><TH>{dict.payroll.paidAmount}</TH><TH>{dict.payroll.remainingAmount}</TH><TH>{dict.common.status}</TH><TH /></TR></THead>
            <TBody>
              {data.payrollRecords.map((r) => (
                <TR key={r.id}>
                  <TD>{r.payrollPeriod.label}</TD><TD>{formatMoney(r.grossTotal)}</TD><TD className="font-semibold">{formatMoney(r.netPayable)}</TD>
                  <TD>{formatMoney(r.paidAmount)}</TD><TD>{formatMoney(r.remainingAmount)}</TD>
                  <TD><StatusBadge status={r.status} label={dict.statuses.recordStatus[r.status]} /></TD>
                  <TD><Link href={`/payroll/records/${r.id}`} className="text-xs text-primary hover:underline">{dict.payroll.viewDetails}</Link></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="advances">
        {data.advances.length === 0 ? <EmptyState title={dict.advances.noResults} /> : (
          <Table>
            <THead><TR><TH>{dict.common.date}</TH><TH>{dict.common.amount}</TH><TH>{dict.advances.remainingBalance}</TH><TH>{dict.common.reason}</TH><TH>{dict.common.status}</TH></TR></THead>
            <TBody>
              {data.advances.map((a) => (
                <TR key={a.id}>
                  <TD>{formatDate(a.date)}</TD><TD>{formatMoney(a.amount)}</TD><TD className="font-semibold">{formatMoney(a.remainingBalance)}</TD>
                  <TD>{a.reason ?? "—"}</TD><TD><StatusBadge status={a.status} label={dict.statuses.advanceStatus[a.status]} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="deductions">
        {data.deductions.length === 0 ? <EmptyState title={dict.deductions.noResults} /> : (
          <Table>
            <THead><TR><TH>{dict.common.date}</TH><TH>{dict.common.type}</TH><TH>{dict.common.amount}</TH><TH>{dict.common.reason}</TH><TH>{dict.common.status}</TH></TR></THead>
            <TBody>
              {data.deductions.map((d) => (
                <TR key={d.id}>
                  <TD>{formatDate(d.date)}</TD><TD>{dict.statuses.deductionType[d.type]}</TD><TD>{formatMoney(d.amount)}</TD>
                  <TD>{d.reason ?? "—"}</TD><TD><StatusBadge status={d.status} label={dict.statuses.recordStatus[d.status]} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="bonuses">
        {data.bonuses.length === 0 ? <EmptyState title={dict.bonuses.noResults} /> : (
          <Table>
            <THead><TR><TH>{dict.common.date}</TH><TH>{dict.bonuses.bonusType}</TH><TH>{dict.common.amount}</TH><TH>{dict.common.reason}</TH></TR></THead>
            <TBody>
              {data.bonuses.map((b) => (
                <TR key={b.id}><TD>{formatDate(b.date)}</TD><TD>{b.type}</TD><TD>{formatMoney(b.amount)}</TD><TD>{b.reason ?? "—"}</TD></TR>
              ))}
            </TBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="overtime">
        {data.overtimeEntries.length === 0 ? <EmptyState title={dict.overtime.noResults} /> : (
          <Table>
            <THead><TR><TH>{dict.common.date}</TH><TH>{dict.overtime.overtimeDuration}</TH><TH>{dict.overtime.overtimeAmount}</TH><TH>{dict.overtime.approved}</TH></TR></THead>
            <TBody>
              {data.overtimeEntries.map((o) => (
                <TR key={o.id}>
                  <TD>{formatDate(o.date)}</TD><TD><DurationBadge minutes={o.overtimeMinutes} /></TD><TD>{formatMoney(o.overtimeAmount)}</TD>
                  <TD>{o.approved ? dict.common.yes : dict.common.no}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="expenses">
        {data.expenses.length === 0 ? <EmptyState title={dict.expenses.noResults} /> : (
          <Table>
            <THead><TR><TH>{dict.common.date}</TH><TH>{dict.expenses.expenseType}</TH><TH>{dict.common.amount}</TH><TH>{dict.expenses.approvalStatus}</TH><TH>{dict.expenses.paymentStatus}</TH></TR></THead>
            <TBody>
              {data.expenses.map((e) => (
                <TR key={e.id}>
                  <TD>{formatDate(e.date)}</TD><TD>{e.expenseType}</TD><TD>{formatMoney(e.amount)}</TD>
                  <TD><StatusBadge status={e.approvalStatus} label={dict.statuses.approvalStatus[e.approvalStatus]} /></TD>
                  <TD><StatusBadge status={e.paymentStatus} label={dict.statuses.expensePaymentStatus[e.paymentStatus]} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="leave">
        {data.leaveRequests.length === 0 ? <EmptyState title={dict.leave.noResults} /> : (
          <Table>
            <THead><TR><TH>{dict.leave.leaveType}</TH><TH>{dict.leave.startDate}</TH><TH>{dict.leave.endDate}</TH><TH>{dict.leave.numberOfDays}</TH><TH>{dict.common.status}</TH></TR></THead>
            <TBody>
              {data.leaveRequests.map((l) => (
                <TR key={l.id}>
                  <TD>{dict.statuses.leaveType[l.leaveType]}</TD><TD>{formatDate(l.startDate)}</TD><TD>{formatDate(l.endDate)}</TD>
                  <TD>{l.numberOfDays.toString()}</TD><TD><StatusBadge status={l.status} label={dict.statuses.leaveStatus[l.status]} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="ledger">
        {data.ledgerEntries.length === 0 ? <EmptyState title={dict.common.noData} /> : (
          <Table>
            <THead><TR><TH>{dict.common.date}</TH><TH>{dict.common.type}</TH><TH>{dict.common.description}</TH><TH>{dict.common.debit}</TH><TH>{dict.common.credit}</TH><TH>{dict.common.balance}</TH></TR></THead>
            <TBody>
              {data.ledgerEntries.map((l) => (
                <TR key={l.id}>
                  <TD>{formatDate(l.date)}</TD><TD>{l.type}</TD><TD>{l.description}</TD>
                  <TD className="text-danger">{Number(l.debit) > 0 ? formatMoney(l.debit) : "—"}</TD>
                  <TD className="text-success">{Number(l.credit) > 0 ? formatMoney(l.credit) : "—"}</TD>
                  <TD className="font-semibold">{formatMoney(l.balanceAfter)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}
