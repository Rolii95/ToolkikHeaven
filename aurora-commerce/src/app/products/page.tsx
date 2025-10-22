import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import ProductGrid from '@/components/ProductGrid';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <ProductGrid products={products} />
    </div>
  );
};

export default ProductsPage;