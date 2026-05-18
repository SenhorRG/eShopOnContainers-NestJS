{{- define "eshop-nestjs.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "eshop-nestjs.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "eshop-nestjs.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "eshop-nestjs.labels" -}}
helm.sh/chart: {{ include "eshop-nestjs.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "eshop-nestjs.serviceFullname" -}}
{{- $root := index . "root" }}
{{- $name := index . "name" }}
{{- printf "%s-%s" (include "eshop-nestjs.fullname" $root) $name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "eshop-nestjs.image" -}}
{{- $root := index . "root" }}
{{- $svc := index . "svc" }}
{{- printf "%s/%s/%s:%s" $root.Values.global.imageRegistry $root.Values.global.imageRepositoryPrefix $svc.image.repository $svc.image.tag }}
{{- end }}

{{- define "eshop-nestjs.serviceDnsName" -}}
{{- $root := index . "root" }}
{{- $target := index . "target" }}
{{- $port := index . "port" }}
{{- $fullname := include "eshop-nestjs.serviceFullname" (dict "root" $root "name" $target) }}
{{- printf "http://%s:%v" $fullname $port }}
{{- end }}
