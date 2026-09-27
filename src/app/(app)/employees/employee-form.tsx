"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toDateInputValue } from "@/lib/format";
import type { Department, Employee, Position } from "@/generated/prisma/client";

export function EmployeeForm({
  action,
  employee,
  departments,
  positions,
  suggestedEmployeeNumber,
}: {
  action: (formData: FormData) => void;
  employee?: Employee;
  departments: Department[];
  positions: Position[];
  suggestedEmployeeNumber?: string;
}) {
  const { dict } = useI18n();
  const [employmentType, setEmploymentType] = useState(employee?.employmentType ?? "FULL_TIME");

  return (
    <form action={action} className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{dict.employees.sectionBasicInfo}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={dict.employees.employeeNumber} htmlFor="employeeNumber" required>
            <Input id="employeeNumber" name="employeeNumber" required defaultValue={employee?.employeeNumber ?? suggestedEmployeeNumber} />
          </Field>
          <Field label={dict.employees.fullNameAr} htmlFor="fullNameAr" required>
            <Input id="fullNameAr" name="fullNameAr" dir="rtl" required defaultValue={employee?.fullNameAr} />
          </Field>
          <Field label={dict.employees.fullNameEn} htmlFor="fullNameEn" required>
            <Input id="fullNameEn" name="fullNameEn" required defaultValue={employee?.fullNameEn} />
          </Field>
          <Field label={dict.common.phone} htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={employee?.phone ?? ""} />
          </Field>
          <Field label={dict.common.email} htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={employee?.email ?? ""} />
          </Field>
          <Field label={dict.employees.nationalId} htmlFor="nationalId">
            <Input id="nationalId" name="nationalId" defaultValue={employee?.nationalId ?? ""} />
          </Field>
          <Field label={dict.employees.dateOfBirth} htmlFor="dateOfBirth">
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={toDateInputValue(employee?.dateOfBirth)} />
          </Field>
          <Field label={dict.employees.address} htmlFor="address" className="sm:col-span-2 lg:col-span-2">
            <Input id="address" name="address" defaultValue={employee?.address ?? ""} />
          </Field>
          <Field label={dict.employees.photo} htmlFor="photo">
            <Input id="photo" name="photo" type="file" accept="image/*" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.employees.sectionEmployment}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={dict.common.department} htmlFor="departmentId">
            <Select id="departmentId" name="departmentId" defaultValue={employee?.departmentId ?? ""}>
              <option value="">{dict.common.selectPlaceholder}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label={dict.common.position} htmlFor="positionId">
            <Select id="positionId" name="positionId" defaultValue={employee?.positionId ?? ""}>
              <option value="">{dict.common.selectPlaceholder}</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </Select>
          </Field>
          <Field label={dict.common.jobTitle} htmlFor="jobTitle">
            <Input id="jobTitle" name="jobTitle" defaultValue={employee?.jobTitle ?? ""} />
          </Field>
          <Field label={dict.common.type} htmlFor="employmentType" required>
            <Select
              id="employmentType"
              name="employmentType"
              required
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as typeof employmentType)}
            >
              <option value="DAILY">{dict.statuses.employmentType.DAILY}</option>
              <option value="PART_TIME">{dict.statuses.employmentType.PART_TIME}</option>
              <option value="FULL_TIME">{dict.statuses.employmentType.FULL_TIME}</option>
            </Select>
          </Field>
          <Field label={dict.common.status} htmlFor="status" required>
            <Select id="status" name="status" required defaultValue={employee?.status ?? "ACTIVE"}>
              <option value="ACTIVE">{dict.statuses.employeeStatus.ACTIVE}</option>
              <option value="INACTIVE">{dict.statuses.employeeStatus.INACTIVE}</option>
              <option value="ON_LEAVE">{dict.statuses.employeeStatus.ON_LEAVE}</option>
              <option value="TERMINATED">{dict.statuses.employeeStatus.TERMINATED}</option>
            </Select>
          </Field>
          <Field label={dict.employees.hireDate} htmlFor="hireDate" required>
            <Input id="hireDate" name="hireDate" type="date" required defaultValue={toDateInputValue(employee?.hireDate) || toDateInputValue(new Date())} />
          </Field>
          <Field label={dict.employees.contractStartDate} htmlFor="contractStartDate">
            <Input id="contractStartDate" name="contractStartDate" type="date" defaultValue={toDateInputValue(employee?.contractStartDate)} />
          </Field>
          <Field label={dict.employees.contractEndDate} htmlFor="contractEndDate">
            <Input id="contractEndDate" name="contractEndDate" type="date" defaultValue={toDateInputValue(employee?.contractEndDate)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.employees.sectionSalary}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employmentType === "DAILY" && (
            <>
              <Field label={dict.employees.dailyPayBasis} htmlFor="dailyPayBasis">
                <Select id="dailyPayBasis" name="dailyPayBasis" defaultValue={employee?.dailyPayBasis ?? "HOURLY"}>
                  <option value="HOURLY">{dict.statuses.dailyPayBasis.HOURLY}</option>
                  <option value="FIXED_DAILY">{dict.statuses.dailyPayBasis.FIXED_DAILY}</option>
                </Select>
              </Field>
              <Field label={dict.employees.hourlyRate} htmlFor="hourlyRate">
                <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" min="0" defaultValue={employee?.hourlyRate?.toString() ?? "0"} />
              </Field>
              <Field label={dict.employees.dailyRate} htmlFor="dailyRate">
                <Input id="dailyRate" name="dailyRate" type="number" step="0.01" min="0" defaultValue={employee?.dailyRate?.toString() ?? "0"} />
              </Field>
            </>
          )}
          {employmentType === "PART_TIME" && (
            <>
              <Field label={dict.employees.hourlyRate} htmlFor="hourlyRate">
                <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" min="0" defaultValue={employee?.hourlyRate?.toString() ?? "0"} />
              </Field>
              <Field label={dict.employees.weeklyRate} htmlFor="weeklyRate">
                <Input id="weeklyRate" name="weeklyRate" type="number" step="0.01" min="0" defaultValue={employee?.weeklyRate?.toString() ?? "0"} />
              </Field>
              <input type="hidden" name="dailyPayBasis" value="HOURLY" />
            </>
          )}
          {employmentType === "FULL_TIME" && (
            <>
              <Field label={dict.employees.basicSalary} htmlFor="basicSalary">
                <Input id="basicSalary" name="basicSalary" type="number" step="0.01" min="0" defaultValue={employee?.basicSalary?.toString() ?? "0"} />
              </Field>
              <Field label={dict.employees.monthlySalary} htmlFor="monthlySalary">
                <Input id="monthlySalary" name="monthlySalary" type="number" step="0.01" min="0" defaultValue={employee?.monthlySalary?.toString() ?? "0"} />
              </Field>
              <input type="hidden" name="dailyPayBasis" value="HOURLY" />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.employees.sectionBank}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={dict.employees.bankName} htmlFor="bankName">
            <Input id="bankName" name="bankName" defaultValue={employee?.bankName ?? ""} />
          </Field>
          <Field label={dict.employees.bankAccountNumber} htmlFor="bankAccountNumber">
            <Input id="bankAccountNumber" name="bankAccountNumber" defaultValue={employee?.bankAccountNumber ?? ""} />
          </Field>
          <Field label={dict.employees.bankIban} htmlFor="bankIban">
            <Input id="bankIban" name="bankIban" defaultValue={employee?.bankIban ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.employees.sectionEmergency}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={dict.employees.emergencyContactName} htmlFor="emergencyContactName">
            <Input id="emergencyContactName" name="emergencyContactName" defaultValue={employee?.emergencyContactName ?? ""} />
          </Field>
          <Field label={dict.employees.emergencyContactPhone} htmlFor="emergencyContactPhone">
            <Input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={employee?.emergencyContactPhone ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.employees.sectionNotes}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" defaultValue={employee?.notes ?? ""} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit">{dict.common.save}</Button>
      </div>
    </form>
  );
}
