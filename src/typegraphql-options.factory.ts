import { Injectable, Inject } from "@nestjs/common";
import { GqlOptionsFactory, GqlModuleOptions } from "@nestjs/graphql";
import { GraphQLSchema } from "graphql/type";
import { buildSchema, ClassType, NonEmptyArray } from "type-graphql";
import { mergeSchemas } from '@graphql-tools/schema'

import {
  TYPEGRAPHQL_ROOT_MODULE_OPTIONS,
  TYPEGRAPHQL_FEATURE_MODULE_OPTIONS,
} from "./constants";
import {
  TypeGraphQLRootModuleOptions,
  TypeGraphQLFeatureModuleOptions,
} from "./types";
import OptionsPreparatorService from "./prepare-options.service";


@Injectable()
export default class TypeGraphQLOptionsFactory implements GqlOptionsFactory {
  constructor(
    @Inject(TYPEGRAPHQL_ROOT_MODULE_OPTIONS)
    private readonly rootModuleOptions: TypeGraphQLRootModuleOptions<GqlModuleOptions>,
    private readonly optionsPreparatorService: OptionsPreparatorService,
  ) {}

  async createGqlOptions(): Promise<Omit<GqlModuleOptions, "driver">> {
    const { globalMiddlewares, transformSchema } = this.rootModuleOptions;
    const { resolversClasses, container, orphanedTypes } =
      this.optionsPreparatorService.prepareOptions<TypeGraphQLFeatureModuleOptions>(
        TYPEGRAPHQL_FEATURE_MODULE_OPTIONS,
        globalMiddlewares,
      );

    const schema = await buildSchema({
      ...this.rootModuleOptions,
      resolvers: resolversClasses as NonEmptyArray<ClassType>,
      orphanedTypes,
      container,
    });

    const transformSchemaInternal = async (executableSchema: GraphQLSchema): Promise<GraphQLSchema> => {
      const transformedSchemaInternal = executableSchema
        ? mergeSchemas({ schemas: [executableSchema, schema] })
        : schema

      return transformSchema ? transformSchema(transformedSchemaInternal) : transformedSchemaInternal
    }

    return {
      ...this.rootModuleOptions,
      transformSchema: transformSchemaInternal,
    };
  }
}
