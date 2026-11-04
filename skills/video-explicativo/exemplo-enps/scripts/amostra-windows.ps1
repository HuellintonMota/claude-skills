param([string]$TextoArquivo, [string]$Saida)
$texto = [IO.File]::ReadAllText($TextoArquivo, [Text.Encoding]::UTF8).Trim()

Add-Type -AssemblyName System.Speech
$sapi = New-Object System.Speech.Synthesis.SpeechSynthesizer
$sapi.SelectVoice('Microsoft Maria Desktop')
$sapi.SetOutputToWaveFile((Join-Path $Saida 'windows-sapi-Maria.wav'))
$sapi.Speak($texto)
$sapi.Dispose()

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
foreach ($voz in [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.Language -eq 'pt-BR' }) {
    $synth.Voice = $voz
    $task = $asTask.MakeGenericMethod([Windows.Media.SpeechSynthesis.SpeechSynthesisStream]).Invoke($null, @($synth.SynthesizeTextToStreamAsync($texto)))
    $task.Wait()
    $stream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($task.Result)
    $nome = 'windows-onecore-' + ($voz.DisplayName -replace '^Microsoft ', '' -replace '\s+', '-') + '.wav'
    $arq = [IO.File]::Create((Join-Path $Saida $nome))
    $stream.CopyTo($arq); $arq.Close(); $stream.Close()
    Write-Output "ok $nome"
}
