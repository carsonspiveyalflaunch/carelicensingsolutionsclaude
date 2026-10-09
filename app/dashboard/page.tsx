"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '../components/CustomerHeader';
import DashboardClient from '../components/DashboardClient';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../../utils/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }

    if (!loading && user && profile?.is_admin) {
      router.replace('/admin');
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user || loading || profile?.is_admin) {
        setFetching(false);
        return;
      }

      try {
        setFetching(true);

        if (!supabase) {
          throw new Error('Supabase client not configured.');
        }

        const { data: userProductsData, error: userProductsError } = await supabase
          .from('user_products')
          .select(`
            id,
            product_id,
            purchase_id,
            granted_at,
            is_active,
            purchased_items,
            products (
              id,
              name,
              description,
              type,
              features,
              product_slug,
              product_label,
              metadata
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (userProductsError) {
          throw userProductsError;
        }

        const { data: purchasesData, error: purchasesError } = await supabase
          .from('purchases')
          .select(`
            id,
            amount,
            status,
            created_at,
            metadata
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (purchasesError) {
          throw purchasesError;
        }

        // Parse purchases to extract items from metadata
        const parsedPurchases = (purchasesData || []).map((p: any) => {
          let items = [];
          if (p.metadata?.items) {
            items = Array.isArray(p.metadata.items) ? p.metadata.items : [];
          }
          return {
            id: p.id,
            amount: p.amount,
            status: p.status,
            created_at: p.created_at,
            items: items,
          };
        });

        setUserProducts(userProductsData || []);
        setPurchases(parsedPurchases);
      } catch (fetchError: any) {
        console.error('Dashboard data error:', fetchError);
        setError(fetchError?.message || 'Unable to load dashboard data.');
      } finally {
        setFetching(false);
      }
    };

    loadDashboardData();
  }, [user, loading, profile]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-700">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.is_admin) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to load dashboard</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CustomerHeader />
      <DashboardClient
        user={user}
        profile={profile}
        userProducts={userProducts}
        purchases={purchases}
      />
    </>
  );
}


