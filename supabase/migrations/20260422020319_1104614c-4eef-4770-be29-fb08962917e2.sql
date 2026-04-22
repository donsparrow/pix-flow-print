-- Remove the public INSERT policy on itens_pedido.
-- All legitimate inserts happen through the criar_pedido SECURITY DEFINER RPC,
-- which bypasses RLS. Keeping a public INSERT policy lets attackers inject
-- fraudulent line items into any recently-created order whose UUID they know/guess.
DROP POLICY IF EXISTS "Itens criáveis para pedidos recentes" ON public.itens_pedido;