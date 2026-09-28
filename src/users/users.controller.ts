import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentUser } from '../common/current-user.decorator';
import { UsersService } from './users.service';
class UpdateProfileDto { @ApiProperty({required:false}) @IsOptional() @IsString() name?:string; }
class ChangePasswordDto { @ApiProperty() @IsString() currentPassword:string; @ApiProperty() @IsString() @MinLength(8) newPassword:string; }
@ApiTags('Users') @ApiBearerAuth() @Controller('users/me') export class UsersController {
  constructor(private readonly users:UsersService){}
  @Get() profile(@CurrentUser() u:any){return this.users.profile(u.id)}
  @Patch() update(@CurrentUser() u:any,@Body() d:UpdateProfileDto){return this.users.update(u.id,d.name)}
  @Post('change-password') password(@CurrentUser() u:any,@Body() d:ChangePasswordDto){return this.users.password(u.id,d.currentPassword,d.newPassword)}
  @Delete() remove(@CurrentUser() u:any){return this.users.remove(u.id)}
}
