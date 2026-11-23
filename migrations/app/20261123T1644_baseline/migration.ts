#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/85cea4c2193aa56b073b9911f88533697c7828cd9a34b184a6a05b3880b33eee/contract';
import endContract from '../../snapshots/85cea4c2193aa56b073b9911f88533697c7828cd9a34b184a6a05b3880b33eee/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'centre_travail',
        columns: [
          col('actif', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('creeLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('majLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('nom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'client',
        columns: [
          col('actif', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('codeEbp', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('creeLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('majLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('nom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'essence',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'famille_produit',
        columns: [
          col('creeLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'matiere',
        columns: [
          col('actif', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('codeEbp', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('coutHT', 'numeric(10,4)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 4 } },
          }),
          col('creeLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('designation', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('epaisseurMm', 'numeric(6,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 6, scale: 2 } },
          }),
          col('essenceId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('largeurMm', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('longueurMm', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('majLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('prixReleveLe', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('unite', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('matiere_unite_check_81257510', sql`"unite" IN ('PLAQUE', 'PLANCHE')`),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'operation',
        columns: [
          col('actif', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('categorie', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('centreTravailId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('creeLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('majLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('nbOperateurs', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('nom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tempsReglageMin', 'numeric(6,2)', {
            notNull: true,
            default: lit('5.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 6, scale: 2 } },
          }),
          col('tempsUnitaireMin', 'numeric(6,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 6, scale: 2 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'operation_categorie_check_867f57ef',
            sql`"categorie" IN ('PREPARATION_DEBIT', 'USINAGE', 'PONCAGE', 'ASSEMBLAGE', 'FINITION', 'CONDITIONNEMENT')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'parametre',
        columns: [
          col('cle', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('majLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('valeur', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['cle'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'piece',
        columns: [
          col('actif', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('creeLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('libelle', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('majLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'type_coupe',
        columns: [
          col('creeLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('explication', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('majLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('nom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('retraitPlaqueLargeurMm', 'numeric(6,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 6, scale: 2 } },
          }),
          col('retraitPlaqueLongueurMm', 'numeric(6,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 6, scale: 2 } },
          }),
          col('surcoteDelignageMm', 'numeric(6,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 6, scale: 2 } },
          }),
          col('surcoteLongueurMm', 'numeric(6,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 6, scale: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'typologie',
        columns: [
          col('creeLe', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'centre_travail',
        constraint: 'centre_travail_nom_key',
        columns: ['nom'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'essence',
        constraint: 'essence_nom_key',
        columns: ['nom'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'famille_produit',
        constraint: 'famille_produit_nom_key',
        columns: ['nom'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'matiere',
        constraint: 'matiere_designation_key',
        columns: ['designation'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'operation',
        constraint: 'operation_nom_key',
        columns: ['nom'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'piece',
        constraint: 'piece_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'type_coupe',
        constraint: 'type_coupe_nom_key',
        columns: ['nom'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'typologie',
        constraint: 'typologie_nom_key',
        columns: ['nom'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'client',
        index: 'client_codeEbp_idx_fffbba04',
        columns: ['codeEbp'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'matiere',
        index: 'matiere_codeEbp_idx_fffbba04',
        columns: ['codeEbp'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'matiere',
        index: 'matiere_essenceId_idx_71fea885',
        columns: ['essenceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'operation',
        index: 'operation_centreTravailId_idx_32e65291',
        columns: ['centreTravailId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'matiere',
        foreignKey: {
          name: 'matiere_essenceId_fkey',
          columns: ['essenceId'],
          references: { schema: 'public', table: 'essence', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'operation',
        foreignKey: {
          name: 'operation_centreTravailId_fkey',
          columns: ['centreTravailId'],
          references: { schema: 'public', table: 'centre_travail', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
