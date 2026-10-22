-- Categorias iniciais. Rode uma vez: psql -U postgres -d businessexchange -f prisma/seed.sql
INSERT INTO categorias (nome, slug) VALUES
  ('Desenvolvimento web',      'desenvolvimento-web'),
  ('Aplicativos mobile',       'aplicativos-mobile'),
  ('Banco de dados',           'banco-de-dados'),
  ('Infraestrutura e DevOps',  'infraestrutura-devops'),
  ('Redes e servidores',       'redes-servidores'),
  ('Segurança',                'seguranca'),
  ('Suporte técnico',          'suporte-tecnico'),
  ('Outros',                   'outros')
ON CONFLICT (slug) DO NOTHING;
