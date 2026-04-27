'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

interface SalaryPayment {
  _id: string;
  paymentId: string;
  amount: number;
  paymentDate: string;
  month: number;
  year: number;
  paymentType: string;
  status: string;
}

interface Sale {
  _id: string;
  saleId: string;
  finalPrice: number;
  agentCommission: number;
  saleDate: string;
  car?: { brand: string; model: string };
}

interface Rental {
  _id: string;
  rentalId: string;
  totalAmount: number;
  agentCommission: number;
  startDate: string;
  car?: { brand: string; model: string };
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  designation: string;
  department: string;
  baseSalary: number;
  commissionRate: number;
  joiningDate: string;
  isActive: boolean;
  photo?: string;
}

export default function EmployeeDetailPage() {
  const t = useTranslations('EmployeeDetail');
  const commonT = useTranslations('Common');
  const employeesT = useTranslations('Employees');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<{ employee: Employee; payments: SalaryPayment[]; sales: Sale[]; rentals: Rental[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/employees/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>;
  if (!data) notFound();

  const { employee, payments, sales, rentals } = data;

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  const totalCommission = [...sales, ...rentals].reduce((sum, item) => sum + (item.agentCommission || 0), 0);
  const totalPaid = payments.filter(p => p.status === 'Active').reduce((sum, p) => sum + (p.paymentType === 'Deduction' ? -p.amount : p.amount), 0);

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/employees" className="text-sm text-indigo-600 hover:underline">{isRtl ? '←' : '←'} {t('back')}</Link>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">{employee.name}</h2>
          <p className="text-gray-500 font-mono text-sm">{employee.employeeId}</p>
        </div>
        <div className={`flex gap-3 items-center ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {employee.isActive ? t('active') : t('inactive')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card md:col-span-1" style={{ padding: '24px' }}>
          <div className="text-center mb-6">
            {employee.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={employee.photo} alt={employee.name} className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-sm" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-300 text-4xl font-bold border-4 border-white shadow-sm">
                {employee.name.charAt(0)}
              </div>
            )}
            <h3 className="mt-4 font-bold text-gray-800 text-lg">{employee.name}</h3>
            <p className="text-indigo-600 font-medium text-sm">{employee.designation}</p>
            <p className="text-gray-400 text-xs mt-1">{employeesT(`departments.${employee.department.toLowerCase()}`)}</p>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('email')}</span>
              <span className="text-gray-800 font-medium">{employee.email || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('phone')}</span>
              <span className="text-gray-800 font-medium">{employee.phone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('joiningDate')}</span>
              <span className="text-gray-800 font-medium">{new Date(employee.joiningDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('baseSalary')}</span>
              <span className="text-gray-800 font-bold">{formatCurrency(employee.baseSalary)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('commissionRate')}</span>
              <span className="text-indigo-600 font-bold">{employee.commissionRate || 0}%</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #42ca7f', borderRight: isRtl ? '4px solid #42ca7f' : 'none' }}>
              <p className="text-xs text-gray-400 uppercase font-semibold">{t('totalEarnings')}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #28aaa9', borderRight: isRtl ? '4px solid #28aaa9' : 'none' }}>
              <p className="text-xs text-gray-400 uppercase font-semibold">{t('totalCommission')}</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">{formatCurrency(totalCommission)}</p>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">{t('paymentHistory')}</h3>
              <Link href={`/dashboard/salary-payments?employeeId=${employee._id}`} className="text-sm text-indigo-600 hover:underline">{t('addPayment')}</Link>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500 italic">{t('noPayments')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{commonT('date')}</th>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{commonT('type')}</th>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-left' : 'text-right'}`}>{commonT('amount')}</th>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{commonT('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td className="px-4 py-3">{new Date(p.paymentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-[11px] font-medium">{p.paymentType}</span>
                        </td>
                        <td className={`px-4 py-3 font-semibold ${isRtl ? 'text-left' : 'text-right'}`}>{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${p.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 className="font-semibold text-gray-800 mb-4">{t('salesPerformance')}</h3>
            {sales.length === 0 ? (
              <p className="text-sm text-gray-500 italic">{t('noSales')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{t('saleId')}</th>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{t('car')}</th>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-left' : 'text-right'}`}>{commonT('price')}</th>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-left' : 'text-right'}`}>{t('commission')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sales.map((s) => (
                      <tr key={s._id}>
                        <td className="px-4 py-3 font-mono">{s.saleId}</td>
                        <td className="px-4 py-3">{s.car?.brand} {s.car?.model}</td>
                        <td className={`px-4 py-3 ${isRtl ? 'text-left' : 'text-right'}`}>{formatCurrency(s.finalPrice)}</td>
                        <td className={`px-4 py-3 font-semibold text-teal-600 ${isRtl ? 'text-left' : 'text-right'}`}>{formatCurrency(s.agentCommission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 className="font-semibold text-gray-800 mb-4">{t('rentalsPerformance')}</h3>
            {rentals.length === 0 ? (
              <p className="text-sm text-gray-500 italic">{t('noRentals')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{t('rentalId')}</th>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{t('car')}</th>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-left' : 'text-right'}`}>{commonT('amount')}</th>
                      <th className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-left' : 'text-right'}`}>{t('commission')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rentals.map((r) => (
                      <tr key={r._id}>
                        <td className="px-4 py-3 font-mono">{r.rentalId}</td>
                        <td className="px-4 py-3">{r.car?.brand} {r.car?.model}</td>
                        <td className={`px-4 py-3 ${isRtl ? 'text-left' : 'text-right'}`}>{formatCurrency(r.totalAmount)}</td>
                        <td className={`px-4 py-3 font-semibold text-teal-600 ${isRtl ? 'text-left' : 'text-right'}`}>{formatCurrency(r.agentCommission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
