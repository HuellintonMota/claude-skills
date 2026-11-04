<?php
// Remove do banco de DEV tudo o que dev-criar-dados.php gravou (lê os IDs de ../registro-dev.json).
require __DIR__.'/dev-bootstrap.php';

use App\Models\Pesquisa;
use Illuminate\Support\Facades\DB;

$registro = __DIR__.'/../registro-dev.json';
$ids = json_decode((string) @file_get_contents($registro), true)['pesquisas'] ?? [];
$ids = Pesquisa::withTrashed()->whereIn('id', $ids)->where('titulo', 'like', '[VÍDEO] eNPS teste%')->pluck('id')->all();
if (! $ids) {
    exit("Nada a remover.\n");
}

DB::transaction(function () use ($ids) {
    $perguntas = DB::table('pesquisa_perguntas')->whereIn('pesquisa_id', $ids)->pluck('id');
    DB::table('pesquisa_respostas')->whereIn('pesquisa_pergunta_id', $perguntas)->delete();
    DB::table('pesquisa_envios')->whereIn('pesquisa_id', $ids)->delete();
    DB::table('pesquisa_participacoes')->whereIn('pesquisa_id', $ids)->delete();
    DB::table('pesquisa_perguntas')->whereIn('pesquisa_id', $ids)->delete();
    DB::table('audit_logs')->where('auditable_type', Pesquisa::class)->whereIn('auditable_id', $ids)->delete();
    DB::table('pesquisas')->whereIn('id', $ids)->delete();
});
rename($registro, $registro.'.removido-'.date('Ymd-His'));
echo 'Removidas as pesquisas: '.implode(', ', $ids)."\n";
