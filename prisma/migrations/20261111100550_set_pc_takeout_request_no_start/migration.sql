-- PC持ち出し申請の申請Noは、10001から始める（現行のFileMakerの番号と、かぶらないようにするため）。
-- すでにこれより大きい番号があるときは、小さい番号に戻さない。
SELECT setval(
  pg_get_serial_sequence('t_pc_takeout_requests', 'request_no'),
  GREATEST(10000, COALESCE((SELECT MAX("request_no") FROM "t_pc_takeout_requests"), 0)),
  true
);
