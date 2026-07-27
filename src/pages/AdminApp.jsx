import { useState } from 'react';
import Layout from '../components/Layout';
import AppointmentsAdmin from './admin/AppointmentsAdmin';
import BusinessesAdmin from './admin/BusinessesAdmin';
import SellersAdmin from './admin/SellersAdmin';

const TABS = [
  { id: 'citas', label: 'Citas' },
  { id: 'negocios', label: 'Negocios' },
  { id: 'vendedores', label: 'Vendedores' },
];

export default function AdminApp() {
  const [tab, setTab] = useState('citas');
  return (
    <Layout tabs={TABS} active={tab} onTab={setTab}>
      {tab === 'citas' && <AppointmentsAdmin />}
      {tab === 'negocios' && <BusinessesAdmin />}
      {tab === 'vendedores' && <SellersAdmin />}
    </Layout>
  );
}
